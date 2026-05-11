/**
 * 实时风控引擎
 * 功能：发送频率控制（Redis）、封号检测、内容审核、账号健康度评估
 */

import { Injectable, Inject, Logger } from '@nestjs/common'
import { DB_TOKEN } from '../../database/database.module'
import { riskEvents, riskRules, accounts } from '../../database/schema'
import { eq, desc, and, count, gte } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { ConfigService } from '@nestjs/config'

export interface RiskCheckResult {
  allowed: boolean
  reason?: string
  riskLevel?: 'low' | 'medium' | 'high' | 'critical'
  suggestedDelay?: number
}

export interface SendRequest {
  accountId: string
  platform: string
  messageContent: string
}

@Injectable()
export class RiskService {
  private readonly logger = new Logger(RiskService.name)

  // Redis 客户端（可选，无 Redis 时使用内存计数器降级）
  private redisClient: any = null
  private memoryCounters: Map<string, { count: number; resetAt: number }> = new Map()

  constructor(
    @Inject(DB_TOKEN) private db: any,
    private config: ConfigService,
  ) {
    this.initRedis()
  }

  private async initRedis() {
    const redisUrl = this.config.get<string>('REDIS_URL')
    if (redisUrl) {
      try {
        const { default: Redis } = await import('ioredis')
        this.redisClient = new Redis(redisUrl, { lazyConnect: true, maxRetriesPerRequest: 1 })
        await this.redisClient.connect()
        this.logger.log('✅ Redis 风控计数器已连接')
      } catch (err: any) {
        this.logger.warn(`⚠️  Redis 连接失败，使用内存计数器降级: ${err.message}`)
        this.redisClient = null
      }
    }
  }

  // ========== 发送前风控检查 ==========
  async checkBeforeSend(req: SendRequest): Promise<RiskCheckResult> {
    // 1. 获取适用的风控规则
    const rule = await this.getApplicableRule(req.platform)

    // 2. 账号日发送限制检查
    const dailyKey = `risk:daily:${req.accountId}:${new Date().toISOString().split('T')[0]}`
    const dailyCount = await this.getCounter(dailyKey)

    if (dailyCount >= rule.dailySendLimit) {
      await this.recordEvent({
        type: 'daily_limit_exceeded',
        level: 'medium',
        accountId: req.accountId,
        platform: req.platform,
        description: `账号 ${req.accountId} 日发送量已达上限 ${rule.dailySendLimit}`,
      })
      return {
        allowed: false,
        reason: `日发送已达上限 (${dailyCount}/${rule.dailySendLimit})`,
        riskLevel: 'medium',
      }
    }

    // 3. 最小发送间隔检查
    const lastSentKey = `risk:last_sent:${req.accountId}`
    const lastSentTs = await this.getTimestamp(lastSentKey)
    if (lastSentTs) {
      const elapsed = Date.now() - lastSentTs
      const minInterval = rule.minSendInterval * 1000
      if (elapsed < minInterval) {
        return {
          allowed: false,
          reason: `发送间隔不足，需等待 ${Math.ceil((minInterval - elapsed) / 1000)} 秒`,
          riskLevel: 'low',
          suggestedDelay: minInterval - elapsed,
        }
      }
    }

    // 4. 内容安全检测
    if (rule.enableContentFilter) {
      const keywords: string[] = rule.sensitiveKeywords as string[] ?? []
      const found = keywords.filter(k => req.messageContent.includes(k))
      if (found.length > 0) {
        await this.recordEvent({
          type: 'sensitive_content',
          level: 'high',
          accountId: req.accountId,
          platform: req.platform,
          description: `消息包含敏感词：${found.join('、')}`,
        })
        return {
          allowed: false,
          reason: `内容包含敏感词：${found.join('、')}`,
          riskLevel: 'high',
        }
      }
    }

    // 5. 账号风险分检查
    const [account] = await this.db
      .select({ riskScore: accounts.riskScore, status: accounts.status })
      .from(accounts)
      .where(eq(accounts.id, req.accountId))
      .limit(1)

    if (account) {
      if (account.status === 'banned') {
        return { allowed: false, reason: '账号已被封禁', riskLevel: 'critical' }
      }
      if (account.status === 'restricted') {
        return { allowed: false, reason: '账号被限流中', riskLevel: 'high' }
      }
      if ((account.riskScore ?? 0) >= 80) {
        return {
          allowed: false,
          reason: `账号风险分过高 (${account.riskScore})，暂停发送`,
          riskLevel: 'high',
        }
      }
    }

    // 通过检查
    return { allowed: true, riskLevel: 'low' }
  }

  // ========== 发送成功后更新计数 ==========
  async recordSent(accountId: string) {
    const today = new Date().toISOString().split('T')[0]
    const dailyKey = `risk:daily:${accountId}:${today}`
    const lastSentKey = `risk:last_sent:${accountId}`

    await this.incrementCounter(dailyKey, 86400) // 24h 过期
    await this.setTimestamp(lastSentKey, Date.now(), 3600)
  }

  // ========== 检测账号异常（封号/限流）==========
  async detectAccountAnomaly(accountId: string, platform: string, errorMsg: string) {
    const bannedKeywords = ['账号已被封禁', 'account banned', 'banned', '违规', '禁言']
    const restrictedKeywords = ['限流', 'rate limit', 'too many requests', '操作频繁']

    let type = 'unknown_error'
    let level: 'low' | 'medium' | 'high' | 'critical' = 'medium'
    let newStatus: string | null = null

    if (bannedKeywords.some(k => errorMsg.toLowerCase().includes(k.toLowerCase()))) {
      type = 'account_banned'
      level = 'critical'
      newStatus = 'banned'
    } else if (restrictedKeywords.some(k => errorMsg.toLowerCase().includes(k.toLowerCase()))) {
      type = 'account_restricted'
      level = 'high'
      newStatus = 'restricted'
    }

    if (newStatus) {
      // 更新账号状态
      await this.db.update(accounts)
        .set({ status: newStatus, updatedAt: new Date() })
        .where(eq(accounts.id, accountId))

      // 记录风控事件
      await this.recordEvent({
        type,
        level,
        accountId,
        platform,
        description: `${type === 'account_banned' ? '账号被封禁' : '账号被限流'}：${errorMsg}`,
      })

      this.logger.warn(`[风控] 检测到账号异常 ${accountId}: ${type}`)
    }

    // 累加风险分
    await this.increaseRiskScore(accountId, level === 'critical' ? 50 : level === 'high' ? 20 : 5)
  }

  // ========== 更新账号风险分 ==========
  async increaseRiskScore(accountId: string, delta: number) {
    const [acc] = await this.db
      .select({ riskScore: accounts.riskScore })
      .from(accounts)
      .where(eq(accounts.id, accountId))
      .limit(1)

    if (acc) {
      const newScore = Math.min(100, (acc.riskScore ?? 0) + delta)
      await this.db.update(accounts)
        .set({ riskScore: newScore, updatedAt: new Date() })
        .where(eq(accounts.id, accountId))
    }
  }

  // ========== 记录风控事件 ==========
  async recordEvent(data: {
    type: string
    level: 'low' | 'medium' | 'high' | 'critical'
    accountId?: string
    platform?: string
    description?: string
  }) {
    await this.db.insert(riskEvents).values({
      id: uuidv4(),
      type: data.type,
      level: data.level,
      accountId: data.accountId,
      platform: data.platform,
      description: data.description,
      isResolved: false,
    })
  }

  // ========== 获取适用规则 ==========
  private async getApplicableRule(platform: string) {
    const defaultRule = {
      dailySendLimit: 200,
      addFriendLimit: 50,
      minSendInterval: 30,
      enableContentFilter: true,
      sensitiveKeywords: ['贷款', '赌博', '色情', '违禁'],
    }

    try {
      const [platformRule] = await this.db
        .select()
        .from(riskRules)
        .where(and(eq(riskRules.platform, platform), eq(riskRules.isActive, true)))
        .limit(1)

      if (platformRule) return platformRule

      const [globalRule] = await this.db
        .select()
        .from(riskRules)
        .where(and(eq(riskRules.platform, 'all'), eq(riskRules.isActive, true)))
        .limit(1)

      return globalRule ?? defaultRule
    } catch {
      return defaultRule
    }
  }

  // ========== 查询接口 ==========
  async getEvents(filter: any = {}) {
    const limit = Number(filter.limit ?? 50)
    const data = await this.db
      .select()
      .from(riskEvents)
      .orderBy(desc(riskEvents.createdAt))
      .limit(limit)
    return { data, total: data.length }
  }

  async resolveEvent(id: string, userId?: string) {
    const [updated] = await this.db
      .update(riskEvents)
      .set({ isResolved: true, resolvedAt: new Date(), resolvedBy: userId })
      .where(eq(riskEvents.id, id))
      .returning()
    return updated
  }

  async getRules() {
    return this.db.select().from(riskRules)
  }

  async updateRule(id: string, data: any) {
    const [updated] = await this.db
      .update(riskRules)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(riskRules.id, id))
      .returning()
    return updated
  }

  async getStats() {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [unresolved, todayEvents, resolved] = await Promise.all([
      this.db.select({ count: count() }).from(riskEvents).where(eq(riskEvents.isResolved, false)),
      this.db.select({ count: count() }).from(riskEvents).where(gte(riskEvents.createdAt, today)),
      this.db.select({ count: count() }).from(riskEvents).where(eq(riskEvents.isResolved, true)),
    ])

    // 计算账号健康度（平均 100 - riskScore）
    const allAccounts = await this.db.select({ riskScore: accounts.riskScore }).from(accounts)
    const avgRisk = allAccounts.length > 0
      ? allAccounts.reduce((s: number, a: any) => s + (a.riskScore ?? 0), 0) / allAccounts.length
      : 0

    return {
      unresolvedCount: Number(unresolved[0]?.count ?? 0),
      todayEvents: Number(todayEvents[0]?.count ?? 0),
      resolvedCount: Number(resolved[0]?.count ?? 0),
      accountHealthScore: Math.max(0, Math.round(100 - avgRisk)),
    }
  }

  // ========== Redis / 内存计数器 ==========
  private async getCounter(key: string): Promise<number> {
    if (this.redisClient) {
      try {
        const val = await this.redisClient.get(key)
        return Number(val ?? 0)
      } catch {
        return this.getMemoryCounter(key)
      }
    }
    return this.getMemoryCounter(key)
  }

  private async incrementCounter(key: string, ttlSeconds: number): Promise<void> {
    if (this.redisClient) {
      try {
        await this.redisClient.incr(key)
        await this.redisClient.expire(key, ttlSeconds)
        return
      } catch {
        // fall through to memory
      }
    }
    this.incrementMemoryCounter(key, ttlSeconds * 1000)
  }

  private async getTimestamp(key: string): Promise<number | null> {
    if (this.redisClient) {
      try {
        const val = await this.redisClient.get(key)
        return val ? Number(val) : null
      } catch {
        return null
      }
    }
    const entry = this.memoryCounters.get(key)
    return entry && entry.resetAt > Date.now() ? entry.count : null
  }

  private async setTimestamp(key: string, ts: number, ttlSeconds: number): Promise<void> {
    if (this.redisClient) {
      try {
        await this.redisClient.set(key, String(ts), 'EX', ttlSeconds)
        return
      } catch {
        // fall through
      }
    }
    this.memoryCounters.set(key, { count: ts, resetAt: Date.now() + ttlSeconds * 1000 })
  }

  private getMemoryCounter(key: string): number {
    const entry = this.memoryCounters.get(key)
    if (!entry || entry.resetAt < Date.now()) return 0
    return entry.count
  }

  private incrementMemoryCounter(key: string, ttlMs: number): void {
    const existing = this.memoryCounters.get(key)
    if (!existing || existing.resetAt < Date.now()) {
      this.memoryCounters.set(key, { count: 1, resetAt: Date.now() + ttlMs })
    } else {
      existing.count++
    }
  }
}
