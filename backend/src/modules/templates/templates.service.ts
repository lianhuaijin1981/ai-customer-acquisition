import { Injectable, Inject, NotFoundException } from '@nestjs/common'
import { DB_TOKEN } from '../../database/database.module'
import { templates } from '../../database/schema'
import { eq, desc, ilike, and, SQL } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { AiService, GenerateTemplateParams } from '../../common/services/ai.service'

interface TemplateFilter {
  industry?: string
  scene?: string
  status?: string
  keyword?: string
  page?: number
  pageSize?: number
}

@Injectable()
export class TemplatesService {
  constructor(
    @Inject(DB_TOKEN) private db: any,
    private aiService: AiService,
  ) {}

  async findAll(filter: TemplateFilter = {}) {
    const { page = 1, pageSize = 20 } = filter
    const offset = (page - 1) * pageSize

    const conditions: SQL[] = []
    if (filter.industry) conditions.push(eq(templates.industry, filter.industry))
    if (filter.scene) conditions.push(eq(templates.scene, filter.scene))
    if (filter.status) conditions.push(eq(templates.status, filter.status))
    if (filter.keyword) conditions.push(ilike(templates.name, `%${filter.keyword}%`))

    const where = conditions.length > 0 ? and(...conditions) : undefined

    const data = await this.db
      .select()
      .from(templates)
      .where(where)
      .orderBy(desc(templates.createdAt))
      .limit(pageSize)
      .offset(offset)

    return { data, total: data.length, page, pageSize }
  }

  async findById(id: string) {
    const [t] = await this.db.select().from(templates).where(eq(templates.id, id))
    if (!t) throw new NotFoundException(`模板 ${id} 不存在`)
    return t
  }

  async create(data: any, userId?: string) {
    const id = uuidv4()
    const [created] = await this.db.insert(templates).values({
      id,
      ...data,
      createdBy: userId,
    }).returning()
    return created
  }

  async update(id: string, data: any) {
    const [updated] = await this.db
      .update(templates)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(templates.id, id))
      .returning()
    if (!updated) throw new NotFoundException(`模板 ${id} 不存在`)
    return updated
  }

  async remove(id: string) {
    await this.db.delete(templates).where(eq(templates.id, id))
    return { success: true }
  }

  async recordUsage(templateId: string, replied: boolean) {
    const [t] = await this.db.select().from(templates).where(eq(templates.id, templateId))
    if (!t) return

    const newUseCount = (t.useCount ?? 0) + 1
    const newReplyCount = replied ? (t.replyCount ?? 0) + 1 : (t.replyCount ?? 0)
    const newReplyRate = newUseCount > 0 ? newReplyCount / newUseCount : 0

    await this.db.update(templates).set({
      useCount: newUseCount,
      replyCount: newReplyCount,
      replyRate: newReplyRate,
      updatedAt: new Date(),
    }).where(eq(templates.id, templateId))
  }

  // ========== AI 话术生成 ==========
  async aiGenerate(params: GenerateTemplateParams & { save?: boolean }, userId?: string) {
    const result = await this.aiService.generateTemplate(params)

    if (!result.passed) {
      return {
        ...result,
        saved: false,
        message: `生成的内容包含敏感词：${result.sensitiveWords.join('、')}，请重新生成`,
      }
    }

    // 自动保存到模板库
    if (params.save !== false && result.content) {
      const saved = await this.create({
        name: `AI生成-${params.industry}-${new Date().toLocaleDateString()}`,
        industry: params.industry,
        scene: params.scene,
        content: result.content,
        variables: result.variables,
        status: 'active',
      }, userId)

      return { ...result, saved: true, templateId: saved.id }
    }

    return { ...result, saved: false }
  }

  // ========== 话术内容安全检测 ==========
  async checkContent(content: string) {
    return this.aiService.checkSensitiveWords(content)
  }
}
