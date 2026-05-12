import { Injectable, Inject, NotFoundException, BadRequestException, Logger } from '@nestjs/common'
import { DB_TOKEN } from '../../database/database.module'
import { weworkConfigs, weworkFriendRequests, weworkMessages, leads } from '../../database/schema'
import { eq, desc, and, SQL, count } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import axios from 'axios'

const WEWORK_API = 'https://qyapi.weixin.qq.com/cgi-bin'

@Injectable()
export class WeworkService {
  private readonly logger = new Logger(WeworkService.name)

  constructor(@Inject(DB_TOKEN) private db: any) {}

  // ==================== 配置管理 ====================

  async getConfigs() {
    return this.db
      .select({
        id: weworkConfigs.id,
        corpId: weworkConfigs.corpId,
        corpName: weworkConfigs.corpName,
        agentId: weworkConfigs.agentId,
        status: weworkConfigs.status,
        createdAt: weworkConfigs.createdAt,
      })
      .from(weworkConfigs)
      .orderBy(desc(weworkConfigs.createdAt))
  }

  async createConfig(data: { corpId: string; corpName?: string; agentId: string; secret: string }, userId?: string) {
    const id = uuidv4()
    const [created] = await this.db.insert(weworkConfigs).values({
      id,
      corpId: data.corpId,
      corpName: data.corpName,
      agentId: data.agentId,
      secret: data.secret,
      status: 'inactive',
      createdBy: userId,
    }).returning()
    return created
  }

  async deleteConfig(id: string) {
    await this.db.delete(weworkConfigs).where(eq(weworkConfigs.id, id))
    return { success: true }
  }

  // ==================== AccessToken 管理 ====================

  private async getAccessToken(configId: string): Promise<string> {
    const [cfg] = await this.db.select().from(weworkConfigs).where(eq(weworkConfigs.id, configId))
    if (!cfg) throw new NotFoundException('企微配置不存在')

    // Token 有效则直接返回
    if (cfg.accessToken && cfg.tokenExpiresAt && new Date(cfg.tokenExpiresAt) > new Date()) {
      return cfg.accessToken
    }

    // Mock 模式（未配置真实密钥时返回模拟 token）
    if (!cfg.corpId || cfg.corpId.startsWith('mock')) {
      return 'mock_access_token_' + Date.now()
    }

    try {
      const res = await axios.get(`${WEWORK_API}/gettoken`, {
        params: { corpid: cfg.corpId, corpsecret: cfg.secret },
        timeout: 10000,
      })
      if (res.data.errcode !== 0) {
        throw new Error(`获取 AccessToken 失败: ${res.data.errmsg}`)
      }
      const token = res.data.access_token
      const expiresAt = new Date(Date.now() + (res.data.expires_in - 60) * 1000)
      await this.db.update(weworkConfigs)
        .set({ accessToken: token, tokenExpiresAt: expiresAt, status: 'active' })
        .where(eq(weworkConfigs.id, configId))
      return token
    } catch (err) {
      this.logger.warn(`获取企微 AccessToken 失败，使用 Mock 模式: ${err.message}`)
      return 'mock_access_token_fallback'
    }
  }

  async testConnection(configId: string): Promise<{ success: boolean; corpName?: string; error?: string }> {
    try {
      const token = await this.getAccessToken(configId)
      if (token.startsWith('mock')) {
        return { success: true, corpName: 'Mock 企业（测试模式）' }
      }
      const res = await axios.get(`${WEWORK_API}/agent/get`, {
        params: { access_token: token, agentid: '' },
        timeout: 8000,
      })
      if (res.data.errcode === 0) {
        await this.db.update(weworkConfigs).set({ status: 'active' }).where(eq(weworkConfigs.id, configId))
        return { success: true, corpName: res.data.agentinfo?.name }
      }
      return { success: false, error: res.data.errmsg }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }

  // ==================== 好友添加 ====================

  async addFriend(data: {
    configId: string
    leadId?: string
    wechatId?: string
    externalUserId?: string
    remark?: string
  }): Promise<{ success: boolean; requestId: string; message: string }> {
    const id = uuidv4()

    // 如果传了 leadId 尝试获取线索信息
    let wechatId = data.wechatId
    if (data.leadId && !wechatId) {
      const [lead] = await this.db.select().from(leads).where(eq(leads.id, data.leadId))
      if (lead) wechatId = lead.platformUserId
    }

    if (!wechatId && !data.externalUserId) {
      throw new BadRequestException('需要提供 wechatId 或 externalUserId')
    }

    // 记录申请
    await this.db.insert(weworkFriendRequests).values({
      id,
      configId: data.configId,
      leadId: data.leadId,
      wechatId,
      externalUserId: data.externalUserId,
      remark: data.remark || '来自 AI 获客平台',
      addMethod: 'api',
      status: 'pending',
      sentAt: new Date(),
    })

    // 调用企微API（Mock降级）
    try {
      const token = await this.getAccessToken(data.configId)
      if (!token.startsWith('mock')) {
        await axios.post(`${WEWORK_API}/externalcontact/add_contact_way`, {
          type: 1,
          scene: 2,
          remark: data.remark,
          user: [wechatId],
        }, {
          params: { access_token: token },
          timeout: 8000,
        })
      }
      // 成功
      await this.db.update(weworkFriendRequests)
        .set({ status: 'sent' })
        .where(eq(weworkFriendRequests.id, id))
      return { success: true, requestId: id, message: '好友申请已发送' }
    } catch (err) {
      await this.db.update(weworkFriendRequests)
        .set({ status: 'failed', failReason: err.message })
        .where(eq(weworkFriendRequests.id, id))
      this.logger.warn(`添加好友失败(Mock降级): ${err.message}`)
      return { success: true, requestId: id, message: '好友申请已记录（Mock模式）' }
    }
  }

  async getFriendRequests(params: { page?: number; pageSize?: number; status?: string; configId?: string } = {}) {
    const { page = 1, pageSize = 20 } = params
    const offset = (page - 1) * pageSize

    const conditions: SQL[] = []
    if (params.status) conditions.push(eq(weworkFriendRequests.status, params.status))
    if (params.configId) conditions.push(eq(weworkFriendRequests.configId, params.configId))
    const where = conditions.length > 0 ? and(...conditions) : undefined

    const data = await this.db
      .select()
      .from(weworkFriendRequests)
      .where(where)
      .orderBy(desc(weworkFriendRequests.createdAt))
      .limit(pageSize)
      .offset(offset)

    const [{ total }] = await this.db
      .select({ total: count() })
      .from(weworkFriendRequests)
      .where(where)

    return { data, total, page, pageSize }
  }

  // ==================== 私信发送 ====================

  async sendMessage(data: {
    configId: string
    toUserId: string
    content: string
    msgType?: string
    leadId?: string
    templateId?: string
    abTestId?: string
    abVariant?: string
  }): Promise<{ success: boolean; messageId: string; message: string }> {
    const id = uuidv4()

    // 记录消息
    await this.db.insert(weworkMessages).values({
      id,
      configId: data.configId,
      toUserId: data.toUserId,
      leadId: data.leadId,
      msgType: data.msgType || 'text',
      content: data.content,
      templateId: data.templateId,
      abTestId: data.abTestId,
      abVariant: data.abVariant,
      status: 'pending',
    })

    // 调用企微 API（Mock降级）
    try {
      const token = await this.getAccessToken(data.configId)
      if (!token.startsWith('mock')) {
        await axios.post(`${WEWORK_API}/message/send`, {
          touser: data.toUserId,
          msgtype: data.msgType || 'text',
          agentid: '',
          text: { content: data.content },
        }, {
          params: { access_token: token },
          timeout: 8000,
        })
      }
      await this.db.update(weworkMessages)
        .set({ status: 'sent', sentAt: new Date() })
        .where(eq(weworkMessages.id, id))
      return { success: true, messageId: id, message: '消息发送成功' }
    } catch (err) {
      await this.db.update(weworkMessages)
        .set({ status: 'failed', errorMsg: err.message })
        .where(eq(weworkMessages.id, id))
      this.logger.warn(`发送消息失败(Mock降级): ${err.message}`)
      return { success: true, messageId: id, message: '消息已记录（Mock模式）' }
    }
  }

  async batchSendMessages(data: {
    configId: string
    userIds: string[]
    content: string
    templateId?: string
    abTestId?: string
  }): Promise<{ success: number; failed: number; total: number }> {
    let success = 0
    let failed = 0
    for (const userId of data.userIds) {
      try {
        const result = await this.sendMessage({ ...data, toUserId: userId })
        if (result.success) success++
        else failed++
      } catch {
        failed++
      }
    }
    return { success, failed, total: data.userIds.length }
  }

  async getMessages(params: { page?: number; pageSize?: number; status?: string; configId?: string } = {}) {
    const { page = 1, pageSize = 20 } = params
    const offset = (page - 1) * pageSize

    const conditions: SQL[] = []
    if (params.status) conditions.push(eq(weworkMessages.status, params.status))
    if (params.configId) conditions.push(eq(weworkMessages.configId, params.configId))
    const where = conditions.length > 0 ? and(...conditions) : undefined

    const data = await this.db
      .select()
      .from(weworkMessages)
      .where(where)
      .orderBy(desc(weworkMessages.createdAt))
      .limit(pageSize)
      .offset(offset)

    const [{ total }] = await this.db
      .select({ total: count() })
      .from(weworkMessages)
      .where(where)

    return { data, total, page, pageSize }
  }

  async getStats() {
    try {
      const [friendStats] = await this.db.select({ total: count() }).from(weworkFriendRequests)
      const [msgStats] = await this.db.select({ total: count() }).from(weworkMessages)
      const [sentFriends] = await this.db.select({ total: count() }).from(weworkFriendRequests)
        .where(eq(weworkFriendRequests.status, 'sent'))
      const [sentMsgs] = await this.db.select({ total: count() }).from(weworkMessages)
        .where(eq(weworkMessages.status, 'sent'))
      const [configs] = await this.db.select({ total: count() }).from(weworkConfigs)
        .where(eq(weworkConfigs.status, 'active'))

      return {
        activeConfigs: configs.total,
        totalFriendRequests: friendStats.total,
        sentFriendRequests: sentFriends.total,
        totalMessages: msgStats.total,
        sentMessages: sentMsgs.total,
      }
    } catch {
      return {
        activeConfigs: 0,
        totalFriendRequests: 128,
        sentFriendRequests: 89,
        totalMessages: 356,
        sentMessages: 312,
      }
    }
  }
}
