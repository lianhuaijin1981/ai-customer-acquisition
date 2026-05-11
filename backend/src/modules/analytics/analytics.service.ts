import { Injectable, Inject } from '@nestjs/common'
import { DB_TOKEN } from '../../database/database.module'
import { operationData } from '../../database/schema'
import { desc, gte, eq } from 'drizzle-orm'
import dayjs from 'dayjs'
import { AiService } from '../../common/services/ai.service'

@Injectable()
export class AnalyticsService {
  constructor(
    @Inject(DB_TOKEN) private db: any,
    private aiService: AiService,
  ) {}

  async getOverview(filter: any = {}) {
    const days = Number(filter.days ?? 7)
    const startDate = dayjs().subtract(days - 1, 'day').format('YYYY-MM-DD')

    const rows = await this.db
      .select()
      .from(operationData)
      .where(gte(operationData.date, startDate))
      .orderBy(desc(operationData.date))

    if (rows.length === 0) {
      // 无真实数据时返回模拟数据
      return this.mockOverview(days)
    }

    // 按日期聚合（多平台合并）
    const dateMap: Record<string, { sentCount: number; replyCount: number; convertCount: number; addWechatCount: number; cost: number }> = {}
    for (const row of rows) {
      if (!dateMap[row.date]) {
        dateMap[row.date] = { sentCount: 0, replyCount: 0, convertCount: 0, addWechatCount: 0, cost: 0 }
      }
      dateMap[row.date].sentCount += row.sentCount ?? 0
      dateMap[row.date].replyCount += row.replyCount ?? 0
      dateMap[row.date].convertCount += row.convertCount ?? 0
      dateMap[row.date].addWechatCount += row.addWechatCount ?? 0
      dateMap[row.date].cost += row.cost ?? 0
    }

    return Object.entries(dateMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, d]) => ({
        date,
        replyRate: d.sentCount > 0 ? Number(((d.replyCount / d.sentCount) * 100).toFixed(1)) : 0,
        addWechatRate: d.replyCount > 0 ? Number(((d.addWechatCount / d.replyCount) * 100).toFixed(1)) : 0,
        convertRate: d.addWechatCount > 0 ? Number(((d.convertCount / d.addWechatCount) * 100).toFixed(1)) : 0,
        cost: Number(d.cost.toFixed(2)),
        sentCount: d.sentCount,
        replyCount: d.replyCount,
      }))
  }

  async getPlatformComparison(filter: any = {}) {
    const days = Number(filter.days ?? 30)
    const startDate = dayjs().subtract(days - 1, 'day').format('YYYY-MM-DD')

    const rows = await this.db
      .select()
      .from(operationData)
      .where(gte(operationData.date, startDate))

    if (rows.length === 0) {
      return this.mockPlatformComparison()
    }

    const platformMap: Record<string, { leads: number; sent: number; reply: number; addWechat: number; convert: number; cost: number }> = {}
    for (const row of rows) {
      const platform = row.platform ?? 'unknown'
      if (!platformMap[platform]) {
        platformMap[platform] = { leads: 0, sent: 0, reply: 0, addWechat: 0, convert: 0, cost: 0 }
      }
      platformMap[platform].leads += row.leadsCount ?? 0
      platformMap[platform].sent += row.sentCount ?? 0
      platformMap[platform].reply += row.replyCount ?? 0
      platformMap[platform].addWechat += row.addWechatCount ?? 0
      platformMap[platform].convert += row.convertCount ?? 0
      platformMap[platform].cost += row.cost ?? 0
    }

    const platformLabels: Record<string, string> = {
      weibo: '微博',
      xiaohongshu: '小红书',
      douyin: '抖音',
      zhihu: '知乎',
      unknown: '其他',
    }

    return Object.entries(platformMap).map(([platform, d]) => ({
      platform: platformLabels[platform] ?? platform,
      leads: d.leads,
      replyRate: d.sent > 0 ? Number(((d.reply / d.sent) * 100).toFixed(1)) : 0,
      addWechatRate: d.reply > 0 ? Number(((d.addWechat / d.reply) * 100).toFixed(1)) : 0,
      convertRate: d.addWechat > 0 ? Number(((d.convert / d.addWechat) * 100).toFixed(1)) : 0,
      cost: Number((d.sent > 0 ? d.cost / d.sent : 0).toFixed(2)),
    }))
  }

  async getAiSuggestions() {
    // 获取近 7 天数据用于 AI 分析
    const trend = await this.getOverview({ days: 7 })
    const platforms = await this.getPlatformComparison({ days: 30 })

    return this.aiService.getAnalyticsSuggestions({ platforms, trend })
  }

  // ========== 汇总写入 ==========
  async recordDailySummary(date: string, platform: string, data: Partial<typeof operationData.$inferInsert>) {
    await this.db.insert(operationData).values({
      date,
      platform,
      ...data,
    }).onConflictDoNothing()
  }

  // ========== Mock 数据（无真实数据时降级）==========
  private mockOverview(days: number) {
    return Array.from({ length: days }).map((_, i) => ({
      date: dayjs().subtract(days - 1 - i, 'day').format('YYYY-MM-DD'),
      replyRate: Number((18 + Math.random() * 15).toFixed(1)),
      addWechatRate: Number((25 + Math.random() * 12).toFixed(1)),
      convertRate: Number((7 + Math.random() * 7).toFixed(1)),
      cost: Number((30 + Math.random() * 15).toFixed(2)),
      sentCount: Math.floor(100 + Math.random() * 100),
      replyCount: Math.floor(20 + Math.random() * 20),
    }))
  }

  private mockPlatformComparison() {
    return [
      { platform: '微博', leads: 238, replyRate: 22, addWechatRate: 30, convertRate: 8, cost: 0.38 },
      { platform: '小红书', leads: 190, replyRate: 28, addWechatRate: 35, convertRate: 10, cost: 0.32 },
      { platform: '抖音', leads: 150, replyRate: 18, addWechatRate: 24, convertRate: 6, cost: 0.45 },
      { platform: '知乎', leads: 102, replyRate: 32, addWechatRate: 38, convertRate: 12, cost: 0.28 },
    ]
  }
}
