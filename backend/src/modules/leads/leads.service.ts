import { Injectable, Inject } from '@nestjs/common'
import { DB_TOKEN } from '../../database/database.module'
import { leads } from '../../database/schema'
import { eq, and, ilike, gte, lte, desc, count, SQL } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'

interface LeadFilter {
  platform?: string
  status?: string
  intentLevel?: string
  industry?: string
  keyword?: string
  dateFrom?: string
  dateTo?: string
  page?: number
  pageSize?: number
}

@Injectable()
export class LeadsService {
  constructor(@Inject(DB_TOKEN) private db: any) {}

  async findAll(filter: LeadFilter = {}) {
    const { page = 1, pageSize = 20 } = filter
    const offset = (page - 1) * pageSize

    const conditions: SQL[] = []
    if (filter.platform) conditions.push(eq(leads.platform, filter.platform))
    if (filter.status) conditions.push(eq(leads.status, filter.status))
    if (filter.intentLevel) conditions.push(eq(leads.intentLevel, filter.intentLevel))
    if (filter.industry) conditions.push(eq(leads.industry, filter.industry))
    if (filter.keyword) conditions.push(ilike(leads.nickname, `%${filter.keyword}%`))

    const where = conditions.length > 0 ? and(...conditions) : undefined

    const [data, totalResult] = await Promise.all([
      this.db.select().from(leads).where(where).orderBy(desc(leads.createdAt)).limit(pageSize).offset(offset),
      this.db.select({ count: count() }).from(leads).where(where),
    ])

    const total = totalResult[0]?.count ?? 0
    return {
      data,
      total: Number(total),
      page,
      pageSize,
      totalPages: Math.ceil(Number(total) / pageSize),
    }
  }

  async findById(id: string) {
    const [lead] = await this.db.select().from(leads).where(eq(leads.id, id))
    return lead
  }

  async create(data: Partial<typeof leads.$inferInsert>) {
    const id = uuidv4()
    const [created] = await this.db.insert(leads).values({ id, ...data }).returning()
    return created
  }

  async update(id: string, data: Partial<typeof leads.$inferInsert>) {
    const [updated] = await this.db
      .update(leads)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(leads.id, id))
      .returning()
    return updated
  }

  async updateStatus(id: string, status: string) {
    return this.update(id, { status })
  }

  async getStats() {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [total, todayLeads, highIntent] = await Promise.all([
      this.db.select({ count: count() }).from(leads),
      this.db.select({ count: count() }).from(leads).where(gte(leads.createdAt, today)),
      this.db.select({ count: count() }).from(leads).where(eq(leads.intentLevel, 'high')),
    ])

    return {
      total: Number(total[0]?.count ?? 0),
      todayLeads: Number(todayLeads[0]?.count ?? 0),
      highIntent: Number(highIntent[0]?.count ?? 0),
    }
  }
}
