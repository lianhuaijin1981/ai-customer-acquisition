/**
 * 数据采集协调服务
 * 统一管理多平台采集任务、去重、入库、意图评分
 */

import { Injectable, Logger, Inject } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { ConfigService } from '@nestjs/config'
import { DB_TOKEN } from '../../database/database.module'
import { leads } from '../../database/schema'
import { eq, and } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { AiService } from '../../common/services/ai.service'
import { WeiboCollector } from './weibo.collector'
import { XiaohongshuCollector } from './xiaohongshu.collector'
import type { CollectedLead, CollectResult } from './base.collector'

export interface CollectTaskConfig {
  platform: 'weibo' | 'xiaohongshu' | 'all'
  keywords: string[]
  maxPerKeyword?: number
  autoAnalyzeIntent?: boolean
}

@Injectable()
export class CollectorService {
  private readonly logger = new Logger(CollectorService.name)
  private isRunning = false

  private weiboCollector: WeiboCollector
  private xhsCollector: XiaohongshuCollector

  constructor(
    @Inject(DB_TOKEN) private db: any,
    private config: ConfigService,
    private aiService: AiService,
  ) {
    this.weiboCollector = new WeiboCollector({
      cookie: this.config.get<string>('WEIBO_COOKIE'),
    })
    this.xhsCollector = new XiaohongshuCollector({
      cookie: this.config.get<string>('XIAOHONGSHU_COOKIE'),
    })
  }

  // ========== 定时任务：每天凌晨 2 点自动采集 ==========
  @Cron('0 2 * * *', { name: 'daily-collect', timeZone: 'Asia/Shanghai' })
  async scheduledCollect() {
    const defaultKeywords = this.config.get<string>('COLLECT_KEYWORDS', '').split(',').filter(Boolean)
    if (!defaultKeywords.length) {
      this.logger.warn('[采集] 未配置 COLLECT_KEYWORDS，跳过定时采集')
      return
    }

    this.logger.log('[采集] 定时采集任务启动')
    await this.runCollectTask({
      platform: 'all',
      keywords: defaultKeywords,
      maxPerKeyword: 30,
      autoAnalyzeIntent: true,
    })
  }

  // ========== 手动触发采集任务 ==========
  async runCollectTask(config: CollectTaskConfig): Promise<CollectResult[]> {
    if (this.isRunning) {
      this.logger.warn('[采集] 已有任务正在运行，跳过本次请求')
      return []
    }

    this.isRunning = true
    const allResults: CollectResult[] = []

    try {
      for (const keyword of config.keywords) {
        const platforms = config.platform === 'all'
          ? ['weibo', 'xiaohongshu']
          : [config.platform]

        for (const platform of platforms) {
          const result = await this.collectSinglePlatform(
            platform as 'weibo' | 'xiaohongshu',
            keyword,
            config.maxPerKeyword ?? 30,
            config.autoAnalyzeIntent ?? false,
          )
          allResults.push(result)

          // 平台间间隔 5-10 秒
          await new Promise(r => setTimeout(r, 5000 + Math.random() * 5000))
        }
      }
    } finally {
      this.isRunning = false
    }

    return allResults
  }

  private async collectSinglePlatform(
    platform: 'weibo' | 'xiaohongshu',
    keyword: string,
    maxCount: number,
    autoAnalyzeIntent: boolean,
  ): Promise<CollectResult> {
    const result: CollectResult = {
      platform,
      keyword,
      collected: 0,
      saved: 0,
      duplicates: 0,
      errors: [],
      leads: [],
    }

    try {
      const collector = platform === 'weibo' ? this.weiboCollector : this.xhsCollector
      const rawLeads = await collector.collectByKeyword(keyword, maxCount)
      result.collected = rawLeads.length

      for (const rawLead of rawLeads) {
        try {
          // 去重检查
          const [existing] = await this.db
            .select({ id: leads.id })
            .from(leads)
            .where(and(
              eq(leads.platform, platform),
              eq(leads.platformUserId, rawLead.platformUserId),
            ))
            .limit(1)

          if (existing) {
            result.duplicates++
            continue
          }

          // AI 意图分析（可选）
          let intentScore = 30
          let intentLevel: 'high' | 'medium' | 'low' = 'low'

          if (autoAnalyzeIntent) {
            try {
              const analysis = await this.aiService.analyzeIntent({
                bio: rawLead.bio ?? '',
                interactionContent: rawLead.interactionContent,
                platform,
                followerCount: rawLead.followerCount,
              })
              intentScore = analysis.intentScore
              intentLevel = analysis.intentLevel
            } catch {
              // 意图分析失败不影响入库
            }
          } else {
            // 简单规则评分
            const score = this.simpleIntentScore(rawLead)
            intentScore = score
            intentLevel = score >= 70 ? 'high' : score >= 40 ? 'medium' : 'low'
          }

          // 入库
          await this.db.insert(leads).values({
            id: uuidv4(),
            platform,
            platformUserId: rawLead.platformUserId,
            nickname: rawLead.nickname,
            avatar: rawLead.avatar,
            bio: rawLead.bio,
            interactionContent: rawLead.interactionContent,
            interactionType: rawLead.interactionType,
            intentScore,
            intentLevel,
            tags: [keyword, platform],
            status: 'new',
            followerCount: rawLead.followerCount ?? 0,
            location: rawLead.location ?? '',
          })

          result.saved++
          result.leads.push(rawLead)
        } catch (err: any) {
          result.errors.push(err.message)
        }
      }

      this.logger.log(`[采集] ${platform}/${keyword}: 采集${result.collected}，新增${result.saved}，重复${result.duplicates}`)
    } catch (err: any) {
      result.errors.push(err.message)
      this.logger.error(`[采集] ${platform}/${keyword} 失败: ${err.message}`)
    }

    return result
  }

  // ========== 简单规则评分（无 AI 时降级）==========
  private simpleIntentScore(lead: CollectedLead): number {
    let score = 20 // 基础分

    const content = `${lead.bio ?? ''} ${lead.interactionContent}`.toLowerCase()
    const highIntentWords = ['求推荐', '怎么选', '哪家好', '有没有', '想了解', '在用什么', '好用吗', '值得买']
    const mediumIntentWords = ['分享', '体验', '对比', '评测', '测评']

    for (const word of highIntentWords) {
      if (content.includes(word)) score += 15
    }
    for (const word of mediumIntentWords) {
      if (content.includes(word)) score += 8
    }

    // 粉丝数加分（有一定影响力的用户更有价值）
    const followers = lead.followerCount ?? 0
    if (followers > 10000) score += 10
    else if (followers > 1000) score += 5

    return Math.min(100, score)
  }

  getStatus() {
    return { isRunning: this.isRunning }
  }
}
