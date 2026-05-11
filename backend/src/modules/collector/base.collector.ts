/**
 * 数据采集引擎 - 抽象基类
 * 提供采集任务统一接口
 */

export interface CollectedLead {
  platform: string
  platformUserId: string
  nickname: string
  avatar?: string
  bio?: string
  interactionContent: string
  interactionType: string
  followerCount?: number
  location?: string
  keyword?: string
  sourceUrl?: string
}

export interface CollectResult {
  platform: string
  keyword: string
  collected: number
  saved: number
  duplicates: number
  errors: string[]
  leads: CollectedLead[]
}

export interface CollectorConfig {
  cookie?: string
  userAgent?: string
  maxRetries?: number
  delayMs?: number
}

export abstract class BaseCollector {
  protected config: CollectorConfig
  protected readonly DEFAULT_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

  constructor(config: CollectorConfig = {}) {
    this.config = {
      maxRetries: 3,
      delayMs: 2000,
      userAgent: this.DEFAULT_UA,
      ...config,
    }
  }

  abstract collectByKeyword(keyword: string, maxCount?: number): Promise<CollectedLead[]>

  protected async delay(ms?: number) {
    const wait = ms ?? this.config.delayMs ?? 2000
    // 增加随机抖动，模拟真实用户行为
    const jitter = Math.floor(Math.random() * 1000)
    return new Promise(resolve => setTimeout(resolve, wait + jitter))
  }

  protected getHeaders(extra?: Record<string, string>): Record<string, string> {
    return {
      'User-Agent': this.config.userAgent ?? this.DEFAULT_UA,
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'zh-CN,zh;q=0.9',
      'Referer': 'https://www.weibo.com/',
      ...(this.config.cookie ? { 'Cookie': this.config.cookie } : {}),
      ...extra,
    }
  }
}
