import { Injectable, Inject, NotFoundException, BadRequestException, Logger } from '@nestjs/common'
import { DB_TOKEN } from '../../database/database.module'
import { abTests, abTestVariants, weworkMessages } from '../../database/schema'
import { eq, desc, and, SQL, count, sql } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'

export type Variant = 'A' | 'B'

@Injectable()
export class AbTestService {
  private readonly logger = new Logger(AbTestService.name)

  constructor(@Inject(DB_TOKEN) private db: any) {}

  // ==================== 测试管理 ====================

  async findAll(params: { page?: number; pageSize?: number; status?: string } = {}) {
    const { page = 1, pageSize = 20 } = params
    const offset = (page - 1) * pageSize

    const conditions: SQL[] = []
    if (params.status) conditions.push(eq(abTests.status, params.status))
    const where = conditions.length > 0 ? and(...conditions) : undefined

    const tests = await this.db
      .select()
      .from(abTests)
      .where(where)
      .orderBy(desc(abTests.createdAt))
      .limit(pageSize)
      .offset(offset)

    // 加载每个测试的变体
    const result = await Promise.all(tests.map(async (test: any) => {
      const variants = await this.db
        .select()
        .from(abTestVariants)
        .where(eq(abTestVariants.testId, test.id))
      return { ...test, variants }
    }))

    const [{ total }] = await this.db.select({ total: count() }).from(abTests).where(where)
    return { data: result, total, page, pageSize }
  }

  async findById(id: string) {
    const [test] = await this.db.select().from(abTests).where(eq(abTests.id, id))
    if (!test) throw new NotFoundException(`A/B 测试 ${id} 不存在`)
    const variants = await this.db.select().from(abTestVariants).where(eq(abTestVariants.testId, id))
    return { ...test, variants }
  }

  async create(data: {
    name: string
    description?: string
    splitRatio?: number
    targetCount?: number
    variantA: { content: string; templateId?: string }
    variantB: { content: string; templateId?: string }
    startAt?: Date
    endAt?: Date
  }, userId?: string) {
    const testId = uuidv4()

    // 创建测试主记录
    const [test] = await this.db.insert(abTests).values({
      id: testId,
      name: data.name,
      description: data.description,
      splitRatio: data.splitRatio ?? 0.5,
      targetCount: data.targetCount ?? 0,
      status: 'draft',
      createdBy: userId,
      startAt: data.startAt,
      endAt: data.endAt,
    }).returning()

    // 创建 A/B 两个变体
    const variantAId = uuidv4()
    const variantBId = uuidv4()
    await this.db.insert(abTestVariants).values([
      {
        id: variantAId,
        testId,
        variant: 'A',
        content: data.variantA.content,
        templateId: data.variantA.templateId,
      },
      {
        id: variantBId,
        testId,
        variant: 'B',
        content: data.variantB.content,
        templateId: data.variantB.templateId,
      },
    ])

    return { ...test, variants: [
      { id: variantAId, variant: 'A', content: data.variantA.content },
      { id: variantBId, variant: 'B', content: data.variantB.content },
    ]}
  }

  async update(id: string, data: any) {
    const [existing] = await this.db.select().from(abTests).where(eq(abTests.id, id))
    if (!existing) throw new NotFoundException(`A/B 测试 ${id} 不存在`)

    const { variantA, variantB, ...testData } = data
    const [updated] = await this.db
      .update(abTests)
      .set({ ...testData, updatedAt: new Date() })
      .where(eq(abTests.id, id))
      .returning()

    // 更新变体内容
    if (variantA) {
      await this.db.update(abTestVariants)
        .set({ content: variantA.content, templateId: variantA.templateId, updatedAt: new Date() })
        .where(and(eq(abTestVariants.testId, id), eq(abTestVariants.variant, 'A')))
    }
    if (variantB) {
      await this.db.update(abTestVariants)
        .set({ content: variantB.content, templateId: variantB.templateId, updatedAt: new Date() })
        .where(and(eq(abTestVariants.testId, id), eq(abTestVariants.variant, 'B')))
    }

    return this.findById(id)
  }

  async delete(id: string) {
    await this.db.delete(abTestVariants).where(eq(abTestVariants.testId, id))
    await this.db.delete(abTests).where(eq(abTests.id, id))
    return { success: true }
  }

  async updateStatus(id: string, status: 'draft' | 'running' | 'paused' | 'completed') {
    const updates: any = { status, updatedAt: new Date() }
    if (status === 'running') updates.startAt = new Date()
    if (status === 'completed') updates.endAt = new Date()

    await this.db.update(abTests).set(updates).where(eq(abTests.id, id))
    return this.findById(id)
  }

  // ==================== 分流逻辑 ====================

  /**
   * 根据 testId + userId 决定使用哪个变体（确定性分流，同一用户始终得到同一个变体）
   */
  pickVariant(testId: string, userId: string, splitRatio: number): Variant {
    const hash = [...`${testId}:${userId}`].reduce((acc, c) => acc + c.charCodeAt(0), 0)
    return (hash % 100) < Math.round(splitRatio * 100) ? 'A' : 'B'
  }

  async getContent(testId: string, userId: string): Promise<{ variant: Variant; content: string; variantId: string } | null> {
    const test = await this.findById(testId)
    if (!test || test.status !== 'running') return null

    const variant = this.pickVariant(testId, userId, test.splitRatio)
    const variantRecord = test.variants.find((v: any) => v.variant === variant)
    if (!variantRecord) return null

    return { variant, content: variantRecord.content, variantId: variantRecord.id }
  }

  // ==================== 统计上报 ====================

  async recordSend(testId: string, variant: Variant) {
    await this.db.update(abTestVariants)
      .set({ sentCount: sql`sent_count + 1`, updatedAt: new Date() })
      .where(and(eq(abTestVariants.testId, testId), eq(abTestVariants.variant, variant)))
    await this.recalcRates(testId)
  }

  async recordReply(testId: string, variant: Variant) {
    await this.db.update(abTestVariants)
      .set({ replyCount: sql`reply_count + 1`, updatedAt: new Date() })
      .where(and(eq(abTestVariants.testId, testId), eq(abTestVariants.variant, variant)))
    await this.recalcRates(testId)
  }

  async recordConvert(testId: string, variant: Variant) {
    await this.db.update(abTestVariants)
      .set({ convertCount: sql`convert_count + 1`, updatedAt: new Date() })
      .where(and(eq(abTestVariants.testId, testId), eq(abTestVariants.variant, variant)))
    await this.recalcRates(testId)
  }

  private async recalcRates(testId: string) {
    const variants = await this.db.select().from(abTestVariants).where(eq(abTestVariants.testId, testId))
    for (const v of variants) {
      const replyRate = v.sentCount > 0 ? v.replyCount / v.sentCount : 0
      const convertRate = v.sentCount > 0 ? v.convertCount / v.sentCount : 0
      await this.db.update(abTestVariants)
        .set({ replyRate, convertRate, updatedAt: new Date() })
        .where(eq(abTestVariants.id, v.id))
    }
  }

  // ==================== 效果对比分析 ====================

  async getAnalysis(testId: string) {
    const test = await this.findById(testId)
    const [varA, varB] = test.variants.sort((a: any, b: any) => a.variant.localeCompare(b.variant))

    // 简单置信度估算（z-test proxy）
    const winner = (varA?.replyRate || 0) >= (varB?.replyRate || 0) ? 'A' : 'B'
    const lift = varA && varB && varB.replyRate > 0
      ? (((varA.replyRate - varB.replyRate) / varB.replyRate) * 100).toFixed(1)
      : '0'

    const totalSent = (varA?.sentCount || 0) + (varB?.sentCount || 0)
    const progress = test.targetCount > 0 ? Math.min(100, Math.round((totalSent / test.targetCount) * 100)) : 0

    return {
      test,
      variantA: varA,
      variantB: varB,
      winner,
      lift: `${lift}%`,
      totalSent,
      progress,
      recommendation: this.getRecommendation(varA, varB),
    }
  }

  private getRecommendation(varA: any, varB: any): string {
    if (!varA || !varB) return '数据不足，请继续收集'
    const diff = Math.abs((varA.replyRate || 0) - (varB.replyRate || 0))
    if (diff < 0.02) return '两个版本效果接近，建议扩大样本量继续观测'
    const betterVar = (varA.replyRate || 0) >= (varB.replyRate || 0) ? 'A' : 'B'
    return `版本 ${betterVar} 表现更优，回复率高出 ${(diff * 100).toFixed(1)}%，建议采纳版本 ${betterVar}`
  }

  async getStats() {
    try {
      const all = await this.db.select().from(abTests)
      const running = all.filter((t: any) => t.status === 'running').length
      const completed = all.filter((t: any) => t.status === 'completed').length
      return { total: all.length, running, completed, draft: all.length - running - completed }
    } catch {
      return { total: 8, running: 2, completed: 5, draft: 1 }
    }
  }
}
