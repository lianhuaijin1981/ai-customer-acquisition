import { Injectable, Inject } from '@nestjs/common'
import { DB_TOKEN } from '../../database/database.module'
import { outreachTasks, outreachLogs } from '../../database/schema'
import { eq, desc, count, and, gte } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'

@Injectable()
export class OutreachService {
  constructor(@Inject(DB_TOKEN) private db: any) {}

  async findAll(filter: any = {}) {
    const { page = 1, pageSize = 20 } = filter
    const offset = (page - 1) * pageSize

    const data = await this.db
      .select()
      .from(outreachTasks)
      .orderBy(desc(outreachTasks.createdAt))
      .limit(pageSize)
      .offset(offset)

    const totalResult = await this.db.select({ count: count() }).from(outreachTasks)
    const total = Number(totalResult[0]?.count ?? 0)

    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) }
  }

  async findById(id: string) {
    const [task] = await this.db.select().from(outreachTasks).where(eq(outreachTasks.id, id))
    return task
  }

  async create(data: any, userId?: string) {
    const id = uuidv4()
    const [created] = await this.db.insert(outreachTasks).values({
      id,
      ...data,
      status: 'pending',
      totalSent: 0,
      totalReplied: 0,
      totalConverted: 0,
      createdBy: userId,
    }).returning()
    return created
  }

  async update(id: string, data: any) {
    const [updated] = await this.db
      .update(outreachTasks)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(outreachTasks.id, id))
      .returning()
    return updated
  }

  async toggleTask(id: string) {
    const task = await this.findById(id)
    if (!task) return null

    const statusMap: Record<string, string> = {
      running: 'paused',
      paused: 'running',
      pending: 'running',
      completed: 'pending', // 重新开始
    }
    const newStatus = statusMap[task.status] ?? 'paused'
    return this.update(id, { status: newStatus })
  }

  async remove(id: string) {
    await this.db.delete(outreachTasks).where(eq(outreachTasks.id, id))
    return { success: true }
  }

  // ========== 获取任务详细日志 ==========
  async getLogs(taskId: string, filter: any = {}) {
    const { page = 1, pageSize = 20 } = filter
    const offset = (page - 1) * pageSize

    const data = await this.db
      .select()
      .from(outreachLogs)
      .where(eq(outreachLogs.taskId, taskId))
      .orderBy(desc(outreachLogs.createdAt))
      .limit(pageSize)
      .offset(offset)

    const totalResult = await this.db
      .select({ count: count() })
      .from(outreachLogs)
      .where(eq(outreachLogs.taskId, taskId))

    return {
      data,
      total: Number(totalResult[0]?.count ?? 0),
      page,
      pageSize,
    }
  }

  // ========== 更新日志回复状态 ==========
  async markReplied(logId: string, replyContent: string) {
    const [updated] = await this.db
      .update(outreachLogs)
      .set({ status: 'replied', repliedAt: new Date(), replyContent })
      .where(eq(outreachLogs.id, logId))
      .returning()

    if (updated) {
      // 更新任务统计
      await this.db.update(outreachTasks)
        .set({ totalReplied: count(), updatedAt: new Date() })
        .where(eq(outreachTasks.id, updated.taskId))
    }

    return updated
  }
}
