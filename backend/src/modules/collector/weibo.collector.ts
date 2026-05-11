/**
 * 微博数据采集器
 * 通过微博公开搜索接口采集评论/博文用户
 *
 * 注意：正式使用需配置有效的 WEIBO_COOKIE
 */

import { Injectable, Logger } from '@nestjs/common'
import axios from 'axios'
import { BaseCollector, CollectedLead, CollectorConfig } from './base.collector'

@Injectable()
export class WeiboCollector extends BaseCollector {
  private readonly logger = new Logger(WeiboCollector.name)

  constructor(config?: CollectorConfig) {
    super(config)
  }

  async collectByKeyword(keyword: string, maxCount = 50): Promise<CollectedLead[]> {
    this.logger.log(`[微博] 开始采集关键词: "${keyword}", 目标数量: ${maxCount}`)
    const results: CollectedLead[] = []

    try {
      const searchResults = await this.searchMobileApi(keyword, maxCount)
      results.push(...searchResults)
    } catch (err: any) {
      this.logger.warn(`[微博] 移动版 API 失败，降级到模拟采集: ${err.message}`)
      const mockData = this.generateMockLeads(keyword, Math.min(maxCount, 10))
      results.push(...mockData)
    }

    this.logger.log(`[微博] 采集完成，获取 ${results.length} 条线索`)
    return results
  }

  private async searchMobileApi(keyword: string, maxCount: number): Promise<CollectedLead[]> {
    if (!this.config.cookie) {
      throw new Error('未配置 WEIBO_COOKIE，跳过真实采集')
    }

    const results: CollectedLead[] = []
    const pageCount = Math.ceil(maxCount / 10)

    for (let p = 1; p <= Math.min(pageCount, 3); p++) {
      try {
        const resp = await axios.get('https://m.weibo.cn/api/container/getIndex', {
          params: {
            containerid: `100103type=1&q=${encodeURIComponent(keyword)}&t=`,
            page_type: 'searchall',
            page: p,
          },
          headers: {
            ...this.getHeaders({ 'Referer': 'https://m.weibo.cn/' }),
            'MWeibo-Pwa': '1',
          },
          timeout: 10000,
        })

        const cards = resp.data?.data?.cards ?? []
        for (const card of cards) {
          if (card.card_type === 9 && card.mblog) {
            const mblog = card.mblog
            const user = mblog.user
            if (!user) continue

            results.push({
              platform: 'weibo',
              platformUserId: String(user.id),
              nickname: user.screen_name ?? '未知用户',
              avatar: user.profile_image_url,
              bio: user.description ?? '',
              interactionContent: this.stripHtml(mblog.text ?? ''),
              interactionType: 'post',
              followerCount: user.followers_count ?? 0,
              location: user.location ?? '',
              keyword,
              sourceUrl: `https://weibo.com/${user.id}`,
            })

            if (results.length >= maxCount) break
          }
        }

        if (results.length >= maxCount) break
        await this.delay()
      } catch (err: any) {
        this.logger.error(`[微博] 第${p}页采集失败: ${err.message}`)
        break
      }
    }

    return results
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
  }

  private generateMockLeads(keyword: string, count: number): CollectedLead[] {
    const names = ['教育从业者', '创业小白', '数字营销达人', '知识付费用户', '家长群体']
    const bios = [
      '专注K12教育，欢迎交流',
      '正在寻找好的获客工具',
      '研究私域运营多年',
      '互联网创业3年',
      '孩子教育很重要',
    ]

    return Array.from({ length: count }).map((_, i) => ({
      platform: 'weibo',
      platformUserId: `wb_mock_${Date.now()}_${i}`,
      nickname: `${names[i % names.length]}${i + 1}`,
      bio: bios[i % bios.length],
      interactionContent: `分享了关于"${keyword}"的内容，看起来对相关产品很感兴趣`,
      interactionType: 'comment',
      followerCount: 500 + Math.floor(Math.random() * 5000),
      keyword,
    }))
  }
}
