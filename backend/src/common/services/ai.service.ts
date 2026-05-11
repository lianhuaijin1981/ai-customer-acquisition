/**
 * AI 服务 - 封装 KIMI / 月之暗面 API
 * 提供：话术生成、意图分析、内容检测、AI 数据分析建议
 */

import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import OpenAI from 'openai'

export interface GenerateTemplateParams {
  industry: string
  scene: 'first_contact' | 'follow_up' | 'add_wechat' | 'custom'
  productDesc: string
  targetAudience?: string
  tone?: 'professional' | 'friendly' | 'casual'
}

export interface GenerateTemplateResult {
  content: string
  variables: string[]
  passed: boolean
  sensitiveWords: string[]
  error?: string
}

export interface AnalyzeIntentParams {
  bio: string
  interactionContent: string
  platform: string
  followerCount?: number
}

export interface AnalyzeIntentResult {
  intentScore: number
  intentLevel: 'high' | 'medium' | 'low'
  industry?: string
  reasons: string[]
  suggestedTemplate?: string
}

export interface AiSuggestion {
  title: string
  desc: string
  priority: 'high' | 'medium' | 'low'
  action?: string
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name)
  private client: OpenAI | null = null

  constructor(private config: ConfigService) {
    const apiKey = this.config.get<string>('KIMI_API_KEY')
    const baseURL = this.config.get<string>('KIMI_BASE_URL', 'https://api.moonshot.cn/v1')

    if (apiKey) {
      this.client = new OpenAI({ apiKey, baseURL })
      this.logger.log('✅ KIMI AI 服务已初始化')
    } else {
      this.logger.warn('⚠️  未配置 KIMI_API_KEY，AI 功能使用 Demo 模式')
    }
  }

  get isEnabled(): boolean {
    return !!this.client
  }

  // ========== 话术生成 ==========
  async generateTemplate(params: GenerateTemplateParams): Promise<GenerateTemplateResult> {
    if (!this.client) {
      return this.demoGenerateTemplate(params)
    }

    const sceneMap: Record<string, string> = {
      first_contact: '首次触达私信',
      follow_up: '二次跟进唤醒',
      add_wechat: '引导加微信',
      custom: '自定义场景',
    }

    const toneMap: Record<string, string> = {
      professional: '专业正式',
      friendly: '友好亲切',
      casual: '轻松随意',
    }

    const prompt = `你是一个专业的私域运营话术专家。
请为以下场景生成一段私信话术：

- 行业：${params.industry}
- 场景：${sceneMap[params.scene]}
- 产品/服务描述：${params.productDesc}
- 目标受众：${params.targetAudience || '不限'}
- 语气风格：${toneMap[params.tone || 'friendly']}

要求：
1. 话术自然真实，避免机器味
2. 不能直接写联系方式，引导加微信时用"平台不方便发资料"为由
3. 长度控制在 80-120 字
4. 在需要个性化填充的地方使用 {{变量名}} 标记（如 {{nickname}}、{{product}}）
5. 只输出话术内容，不要加任何解释

话术：`

    try {
      const model = this.config.get<string>('KIMI_MODEL', 'moonshot-v1-8k')
      const completion = await this.client.chat.completions.create({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
        max_tokens: 300,
      })

      const content = completion.choices[0]?.message?.content?.trim() ?? ''

      // 提取变量
      const variableMatches = content.match(/\{\{(\w+)\}\}/g) ?? []
      const variables = [...new Set(variableMatches.map(v => v.replace(/[{}]/g, '')))]

      // 敏感词检测
      const { passed, sensitiveWords } = this.checkSensitiveWords(content)

      return { content, variables, passed, sensitiveWords }
    } catch (err: any) {
      this.logger.error(`KIMI API 调用失败: ${err.message}`)
      return this.demoGenerateTemplate(params)
    }
  }

  // ========== 线索意图分析 ==========
  async analyzeIntent(params: AnalyzeIntentParams): Promise<AnalyzeIntentResult> {
    if (!this.client) {
      return this.demoAnalyzeIntent(params)
    }

    const prompt = `你是一个精准的销售意图识别专家。
请分析以下用户信息，判断其购买/合作意图：

平台：${params.platform}
用户简介：${params.bio || '无'}
互动内容：${params.interactionContent || '无'}
粉丝数：${params.followerCount || 0}

请按以下 JSON 格式输出分析结果（只输出 JSON，不要其他内容）：
{
  "intentScore": <0-100的整数，代表购买意图强度>,
  "intentLevel": <"high"|"medium"|"low">,
  "industry": <推断的用户所在行业，如"教育"、"电商"等，若无法判断则为null>,
  "reasons": [<简短说明原因的字符串数组，最多3条>],
  "suggestedTemplate": <推荐使用的话术场景："first_contact"|"follow_up"|"add_wechat">
}`

    try {
      const model = this.config.get<string>('KIMI_MODEL', 'moonshot-v1-8k')
      const completion = await this.client.chat.completions.create({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 200,
      })

      const text = completion.choices[0]?.message?.content?.trim() ?? '{}'
      const result = JSON.parse(text) as AnalyzeIntentResult
      return result
    } catch (err: any) {
      this.logger.error(`意图分析 API 调用失败: ${err.message}`)
      return this.demoAnalyzeIntent(params)
    }
  }

  // ========== 数据分析建议 ==========
  async getAnalyticsSuggestions(data: {
    platforms: Array<{ platform: string; leads: number; replyRate: number; addWechatRate: number; cost: number }>
    trend: Array<{ date: string; replyRate: number; convertRate: number }>
  }): Promise<AiSuggestion[]> {
    if (!this.client) {
      return this.demoAnalyticsSuggestions()
    }

    const prompt = `你是一个私域运营数据分析专家。
基于以下运营数据，给出 3-5 条可执行的优化建议：

平台对比数据：
${JSON.stringify(data.platforms, null, 2)}

近期趋势（最近7天）：
${JSON.stringify(data.trend, null, 2)}

请以 JSON 数组格式输出建议（只输出 JSON）：
[
  {
    "title": "建议标题（15字内）",
    "desc": "详细说明（50字内）",
    "priority": "high|medium|low",
    "action": "具体行动建议（20字内）"
  }
]`

    try {
      const model = this.config.get<string>('KIMI_MODEL', 'moonshot-v1-8k')
      const completion = await this.client.chat.completions.create({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.4,
        max_tokens: 500,
      })

      const text = completion.choices[0]?.message?.content?.trim() ?? '[]'
      return JSON.parse(text) as AiSuggestion[]
    } catch (err: any) {
      this.logger.error(`AI 分析建议调用失败: ${err.message}`)
      return this.demoAnalyticsSuggestions()
    }
  }

  // ========== 敏感词检测 ==========
  checkSensitiveWords(content: string): { passed: boolean; sensitiveWords: string[] } {
    const defaultKeywords = ['贷款', '赌博', '色情', '违禁', '发票', '刷单', '兼职', '传销', '诈骗']
    const found = defaultKeywords.filter(k => content.includes(k))
    return { passed: found.length === 0, sensitiveWords: found }
  }

  // ========== Demo 模式降级 ==========
  private demoGenerateTemplate(params: GenerateTemplateParams): GenerateTemplateResult {
    const templates: Record<string, string> = {
      first_contact: `您好 {{nickname}}，看到您分享了{{interaction}}相关的内容，和我们在${params.industry}领域的${params.productDesc}非常契合！有一份干货资料想分享给您，平台不太方便发，可以加个微信吗？`,
      follow_up: `{{nickname}} 您好，之前给您发过消息，不知道有没有收到～关于${params.productDesc}还挺适合您的，方便回复我一下吗？`,
      add_wechat: `{{nickname}} 您好！我的微信是 {{wechat_id}}，有关于${params.productDesc}的详细资料可以发给您，期待进一步交流！`,
      custom: `您好 {{nickname}}，看到您对${params.industry}感兴趣，我们有${params.productDesc}相关服务，欢迎了解一下！`,
    }

    const content = templates[params.scene] ?? templates.first_contact
    const variables = [...new Set((content.match(/\{\{(\w+)\}\}/g) ?? []).map(v => v.replace(/[{}]/g, '')))]

    return { content, variables, passed: true, sensitiveWords: [] }
  }

  private demoAnalyzeIntent(params: AnalyzeIntentParams): AnalyzeIntentResult {
    const score = Math.min(100, Math.max(0,
      (params.interactionContent?.length ?? 0) * 0.5 +
      (params.bio?.length ?? 0) * 0.3 +
      (params.followerCount ? Math.min(50, params.followerCount / 1000) : 0)
    ))

    const rounded = Math.round(score)
    const intentLevel = rounded >= 70 ? 'high' : rounded >= 40 ? 'medium' : 'low'

    return {
      intentScore: rounded,
      intentLevel,
      reasons: ['基于用户互动内容分析', '根据简介关键词判断', '综合平台行为评估'],
      suggestedTemplate: 'first_contact',
    }
  }

  private demoAnalyticsSuggestions(): AiSuggestion[] {
    return [
      { title: '加大小红书投入', desc: '小红书平台回复率高于微博 6%，建议将小红书账号配额提升至 60%。', priority: 'high', action: '调整账号池权重' },
      { title: '优化微博话术', desc: '微博平台回复率偏低，建议 A/B 测试 3 套针对不同兴趣群体的话术。', priority: 'medium', action: '创建 A/B 话术测试任务' },
      { title: '提升高意向筛选精度', desc: '当前高意向阈值 60 分，建议提高至 70 分，减少低质量触达。', priority: 'medium', action: '更新线索筛选规则' },
    ]
  }
}
