import { Injectable, Inject } from '@nestjs/common'
import { DB_TOKEN } from '../../database/database.module'
import { accounts } from '../../database/schema'
import { eq, desc } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'

@Injectable()
export class AccountsService {
  constructor(@Inject(DB_TOKEN) private db: any) {}

  async findAll(filter: any = {}) {
    const data = await this.db.select().from(accounts).orderBy(desc(accounts.createdAt))
    return { data, total: data.length }
  }

  async findById(id: string) {
    const [acc] = await this.db.select().from(accounts).where(eq(accounts.id, id))
    return acc
  }

  async create(data: any) {
    const id = uuidv4()
    const [created] = await this.db.insert(accounts).values({ id, ...data, status: 'inactive' }).returning()
    return created
  }

  async update(id: string, data: any) {
    const [updated] = await this.db.update(accounts).set({ ...data, updatedAt: new Date() }).where(eq(accounts.id, id)).returning()
    return updated
  }

  async toggleAccount(id: string) {
    const acc = await this.findById(id)
    if (!acc) return null
    const newStatus = acc.status === 'active' ? 'inactive' : 'active'
    return this.update(id, { status: newStatus })
  }

  async remove(id: string) {
    await this.db.delete(accounts).where(eq(accounts.id, id))
    return { success: true }
  }
}
