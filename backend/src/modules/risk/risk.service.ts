import { Injectable, Inject } from '@nestjs/common'
import { DB_TOKEN } from '../../database/database.module'
import { riskEvents, riskRules } from '../../database/schema'
import { eq, desc } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'

@Injectable()
export class RiskService {
  constructor(@Inject(DB_TOKEN) private db: any) {}

  async getEvents(filter: any = {}) {
    const data = await this.db.select().from(riskEvents).orderBy(desc(riskEvents.createdAt)).limit(50)
    return { data, total: data.length }
  }

  async resolveEvent(id: string) {
    const [updated] = await this.db
      .update(riskEvents)
      .set({ isResolved: true, resolvedAt: new Date() })
      .where(eq(riskEvents.id, id))
      .returning()
    return updated
  }

  async getRules() {
    return this.db.select().from(riskRules)
  }

  async updateRule(id: string, data: any) {
    const [updated] = await this.db
      .update(riskRules)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(riskRules.id, id))
      .returning()
    return updated
  }

  async getStats() {
    return {
      unresolvedCount: 8,
      todayEvents: 28,
      resolvedCount: 47,
      accountHealthScore: 92,
    }
  }
}
