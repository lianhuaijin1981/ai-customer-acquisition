import { Injectable, Inject } from '@nestjs/common'
import { DB_TOKEN } from '../../database/database.module'
import { operationData } from '../../database/schema'
import { desc, gte } from 'drizzle-orm'
import dayjs from 'dayjs'

@Injectable()
export class AnalyticsService {
  constructor(@Inject(DB_TOKEN) private db: any) {}

  async getOverview(filter: any = {}) {
    const days = Number(filter.days ?? 7)
    const rows = []
    for (let i = days - 1; i >= 0; i--) {
      const date = dayjs().subtract(i, 'day').format('YYYY-MM-DD')
      rows.push({
        date,
        replyRate: 18 + Math.random() * 15,
        addWechatRate: 25 + Math.random() * 12,
        convertRate: 7 + Math.random() * 7,
        cost: 30 + Math.random() * 15,
      })
    }
    return rows
  }

  async getPlatformComparison(filter: any = {}) {
    return [
      { platform: '微博', leads: 238, replyRate: 22, addWechatRate: 30, cost: 38 },
      { platform: '小红书', leads: 190, replyRate: 28, addWechatRate: 35, cost: 32 },
      { platform: '抖音', leads: 150, replyRate: 18, addWechatRate: 24, cost: 45 },
      { platform: '知乎', leads: 102, replyRate: 32, addWechatRate: 38, cost: 28 },
    ]
  }

  async getAiSuggestions() {
    return [
      { title: '提升知乎回复率', desc: '知乎平台回复率最高（32%），建议将知乎账号日触达配额提高至 400 条。', priority: 'high' },
      { title: '优化抖音话术', desc: '抖音平台回复率最低（18%），建议 A/B 测试 3 套话术。', priority: 'medium' },
      { title: '提高高意向筛选精度', desc: '建议将筛选阈值从 60 分提高至 70 分，减少无效触达成本。', priority: 'medium' },
    ]
  }
}
