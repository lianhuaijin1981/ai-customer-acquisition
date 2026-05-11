import { Injectable, Inject } from '@nestjs/common'
import { DB_TOKEN } from '../../database/database.module'
import { customers } from '../../database/schema'
import { eq, desc } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'

@Injectable()
export class CrmService {
  constructor(@Inject(DB_TOKEN) private db: any) {}

  async findAll(filter: any = {}) {
    const data = await this.db.select().from(customers).orderBy(desc(customers.createdAt))
    return { data, total: data.length }
  }

  async findById(id: string) {
    const [c] = await this.db.select().from(customers).where(eq(customers.id, id))
    return c
  }

  async create(data: any) {
    const id = uuidv4()
    const [created] = await this.db.insert(customers).values({ id, ...data }).returning()
    return created
  }

  async update(id: string, data: any) {
    const [updated] = await this.db.update(customers).set({ ...data, updatedAt: new Date() }).where(eq(customers.id, id)).returning()
    return updated
  }

  async remove(id: string) {
    await this.db.delete(customers).where(eq(customers.id, id))
    return { success: true }
  }
}
