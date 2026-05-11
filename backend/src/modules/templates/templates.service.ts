import { Injectable, Inject } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { DB_TOKEN } from '../../database/database.module'
import { templates } from '../../database/schema'
import { eq, desc } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'

@Injectable()
export class TemplatesService {
  constructor(
    @Inject(DB_TOKEN) private db: any,
    private config: ConfigService,
  ) {}

  async findAll(filter: any = {}) {
    const data = await this.db.select().from(templates).orderBy(desc(templates.createdAt))
    return { data, total: data.length }
  }

  async findById(id: string) {
    const [t] = await this.db.select().from(templates).where(eq(templates.id, id))
    return t
  }

  async create(data: any) {
    const id = uuidv4()
    const [created] = await this.db.insert(templates).values({ id, ...data }).returning()
    return created
  }

  async update(id: string, data: any) {
    const [updated] = await this.db.update(templates).set({ ...data, updatedAt: new Date() }).where(eq(templates.id, id)).returning()
    return updated
  }

  async remove(id: string) {
    await this.db.delete(templates).where(eq(templates.id, id))
    return { success: true }
  }

  async aiGenerate(params: { industry: string; scene: string; productDesc: string }) {
    // 调用大模型 API 生成话术
    const apiKey = this.config.get('KIMI_API_KEY')
    const baseUrl = this.config.get('KIMI_BASE_URL', 'https://api.moonshot.cn/v1')

    if (!apiKey) {
      // Demo 模式返回示例话术
      return {
        content: `您好，看到您分享的内容，和我们在${params.industry}领域的产品非常契合。我们有份${params.productDesc}的干货资料想分享给您，方便加个微信吗？（平台这边不好传文件，微信更方便）`,
        passed: true,
        sensitiveWords: [],
      }
    }

    // 实际调用 KIMI API
    try {
      const { OpenAI } = await import('openai')
      const client = new OpenAI({ apiKey, baseURL: baseUrl })
      const prompt = `你是一个专业的销售文案专家。请为${params.industry}行业，${params.scene === 'first_contact' ? '首次触达' : '引导加微信'}场景，产品/服务描述如下：${params.productDesc}，生成一段私信话术。要求：1.不含联系方式，2.引导加微信需使用平台不方便传文件的理由，3.语气自然友好，4.100字以内`

      const completion = await client.chat.completions.create({
        model: 'moonshot-v1-8k',
        messages: [{ role: 'user', content: prompt }],
      })
      const content = completion.choices[0]?.message?.content ?? ''
      return { content, passed: true, sensitiveWords: [] }
    } catch (err) {
      return { content: '', error: err.message }
    }
  }
}
