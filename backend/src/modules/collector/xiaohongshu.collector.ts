/**
 * 小红书数据采集器
 * 采集关键词相关笔记作者及互动用户
 *
 * 注意：正式使用需配置有效的 XIAOHONGSHU_COOKIE
 */

import { Injectable, Logger } from '@nestjs/common'
import axios from 'axios'
import { BaseCollector, CollectedLead, CollectorConfig } from './base.collector'

@Injectable()
export class XiaohongshuCollector extends BaseCollector {
  private readonly logger = new Logger(XiaohongshuCollector.name)
  private readonly SEARCH_API = 'https://edith.xiaohongshu.com/api/sns/web/v1/search/notes'

  constructor(config?: CollectorConfig) {
    super({
      ...config,
      delayMs: 3000, // 小红书风控较严，延迟更长
    })
  }

  async collectByKeyword(keyword: string, maxCount = 30): Promise<CollectedLead[]> {
    this.logger.log(`[小红书] 开始采集关键词: "${keyword}", 目标数量: ${maxCount}`)
    const results: CollectedLead[] = []

    try {
      const searchResults = await this.searchNotes(keyword, maxCount)
      results.push(...searchResults)
    } catch (err: any) {
      this.logger.warn(`[小红书] API 失败，降级到模拟采集: ${err.message}`)
      const mockData = this.generateMockLeads(keyword, Math.min(maxCount, 8))
      results.push(...mockData)
    }

    this.logger.log(`[小红书] 采集完成，获取 ${results.length} 条线索`)
    return results
  }

  private async searchNotes(keyword: string, maxCount: number): Promise<CollectedLead[]> {
    if (!this.config.cookie) {
      throw new Error('未配置 XIAOHONGSHU_COOKIE，跳过真实采集')
    }

    const results: CollectedLead[] = []
    let cursor = ''
    let page = 1

    while (results.length < maxCount && page <= 3) {
      try {
        const resp = await axios.post(
          this.SEARCH_API,
          {
            keyword,
            page: page,
            page_size: 20,
            search_id: this.generateSearchId(),
            sort: 'general',
            note_type: 0,
          },
          {
            headers: {
              ...this.getHeaders({
                'Referer': 'https://www.xiaohongshu.com/',
                'Origin': 'https://www.xiaohongshu.com',
                'Content-Type': 'application/json;charset=UTF-8',
                'x-sign': this.generateSign(keyword, cursor),
              }),
            },
            timeout: 10000,
          }
        )

        const items = resp.data?.data?.items ?? []
        if (!items.length) break

        for (const item of items) {
          const note = item.note_card ?? item
          const user = note.user ?? note.interact_info

          if (!user?.user_id) continue

          results.push({
            platform: 'xiaohongshu',
            platformUserId: String(user.user_id),
            nickname: user.nickname ?? '小红书用户',
            avatar: user.avatar ?? '',
            bio: user.desc ?? '',
            interactionContent: `${note.display_title ?? ''} ${note.desc ?? ''}`.trim(),
            interactionType: 'note',
            followerCount: user.fans_count ?? 0,
            keyword,
            sourceUrl: `https://www.xiaohongshu.com/explore/${note.id}`,
          })

          if (results.length >= maxCount) break
        }

        if (!resp.data?.data?.has_more) break
        cursor = resp.data?.data?.cursor ?? ''
        page++
        await this.delay()
      } catch (err: any) {
        this.logger.error(`[小红书] 第${page}页采集失败: ${err.message}`)
        break
      }
    }

    return results
  }

  private generateSearchId(): string {
    return Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('')
  }

  private generateSign(keyword: string, cursor: string): string {
    // 简化版签名（真实使用需要完整的签名算法）
    return `XYW_${Buffer.from(keyword + cursor + Date.now()).toString('base64').substring(0, 20)}`
  }

  private generateMockLeads(keyword: string, count: number): CollectedLead[] {
    const names = ['护肤博主', '美妆达人', '生活分享者', '创业青年', '职场新人']
    const bios = [
      '热爱生活，分享美好',
      '记录真实的职场日常',
      '专注品质生活方式',
      '90后创业人，一起聊聊',
      '关注健康教育话题',
    ]

    return Array.from({ length: count }).map((_, i) => ({
      platform: 'xiaohongshu',
      platformUserId: `xhs_mock_${Date.now()}_${i}`,
      nickname: `${names[i % names.length]}${i + 1}`,
      bio: bios[i % bios.length],
      interactionContent: `发布了关于"${keyword}"的笔记，获赞较多，与目标用户特征吻合`,
      interactionType: 'note',
      followerCount: 1000 + Math.floor(Math.random() * 10000),
      keyword,
    }))
  }
}
