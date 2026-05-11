import { Injectable, Inject } from '@nestjs/common'
import { DB_TOKEN } from '../../database/database.module'
import { outreachTasks } from '../../database/schema'
import { eq, desc, count } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'

@Injectable()
export class OutreachService {
  constructor(@Inject(DB_TOKEN) private db: any) {}

  async findAll(filter: any = {}) {
    const data = await this.db.select().from(outreachTasks).orderBy(desc(outreachTasks.createdAt))
    return { data, total: data.length, page: 1, pageSize: 50, totalPages: 1 }
  }

  async findById(id: string) {
    const [task] = await this.db.select().from(outreachTasks).where(eq(outreachTasks.id, id))
    return task
  }

  async create(data: any) {
    const id = uuidv4()
    const [created] = await this.db.insert(outreachTasks).values({ id, ...data, status: 'pending' }).returning()
    return created
  }

  async update(id: string, data: any) {
    const [updated] = await this.db.update(outreachTasks).set({ ...data, updatedAt: new Date() }).where(eq(outreachTasks.id, id)).returning()
    return updated
  }

  async toggleTask(id: string) {
    const task = await this.findById(id)
    if (!task) return null
    const newStatus = task.status === 'running' ? 'paused' : 'running'
    return this.update(id, { status: newStatus })
  }

  async remove(id: string) {
    await this.db.delete(outreachTasks).where(eq(outreachTasks.id, id))
    return { success: true }
  }
}
