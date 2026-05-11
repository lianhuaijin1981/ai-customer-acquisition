import { Injectable } from '@nestjs/common'

@Injectable()
export class DashboardService {
  async getStats() {
    // 生产环境从数据库汇总，此处返回演示数据
    return {
      todayLeads: 680,
      todayLeadsGrowth: 12.5,
      todaySent: 410,
      todaySentGrowth: 8.2,
      replyRate: 25.6,
      replyRateGrowth: 3.1,
      addWechatRate: 31.2,
      addWechatRateGrowth: -1.4,
      totalLeads: 12840,
      totalCustomers: 1256,
      activeAccounts: 14,
      todayCost: 328,
    }
  }

  async getTrend(days = 7) {
    const result = []
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      result.push({
        date: dateStr,
        leads: 300 + Math.floor(Math.random() * 400),
        sent: 180 + Math.floor(Math.random() * 250),
        replied: 40 + Math.floor(Math.random() * 80),
        converted: 8 + Math.floor(Math.random() * 30),
      })
    }
    return result
  }

  async getFunnel() {
    return {
      collected: 680,
      filtered: 521,
      sent: 410,
      replied: 105,
      converted: 32,
    }
  }
}
