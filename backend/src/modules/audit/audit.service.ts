import { Injectable, Logger, Inject } from '@nestjs/common'
import { DB_TOKEN } from '../../database/database.module'

export type AuditAction = 'login' | 'logout' | 'create' | 'update' | 'delete' | 'export' | 'config_change' | 'run'

interface AuditLogEntry {
  userId?: string
  username?: string
  action: AuditAction | string
  resource: string
  resourceId?: string
  detail?: string
  ip?: string
  userAgent?: string
  status?: 'success' | 'failed'
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name)

  constructor(@Inject(DB_TOKEN) private db: any) {}

  /**
   * 记录审计日志
   * 采用"先写日志"策略，不阻塞业务流程
   */
  async log(entry: AuditLogEntry): Promise<void> {
    try {
      const { auditLogs } = await import('../../database/schema/index')

      await this.db.insert(auditLogs).values({
        userId: entry.userId || null,
        username: entry.username || null,
        action: entry.action,
        resource: entry.resource,
        resourceId: entry.resourceId || null,
        detail: entry.detail || null,
        ip: entry.ip || null,
        userAgent: entry.userAgent || null,
        status: entry.status || 'success',
      }).execute()
    } catch (err: any) {
      // 审计日志写入失败不应阻塞业务
      this.logger.warn(`审计日志写入失败: ${err.message}`)
    }
  }

  /**
   * 查询审计日志
   */
  async query(params: {
    userId?: string
    action?: string
    resource?: string
    startDate?: string
    endDate?: string
    page?: number
    pageSize?: number
  }) {
    const { auditLogs } = await import('../../database/schema/index')
    const { desc, eq, and, gte, lte, sql } = await import('drizzle-orm')

    const page = params.page || 1
    const pageSize = params.pageSize || 20
    const offset = (page - 1) * pageSize

    const conditions = []
    if (params.userId) conditions.push(eq(auditLogs.userId, params.userId))
    if (params.action) conditions.push(eq(auditLogs.action, params.action))
    if (params.resource) conditions.push(eq(auditLogs.resource, params.resource))
    if (params.startDate) conditions.push(gte(auditLogs.createdAt, new Date(params.startDate)))
    if (params.endDate) conditions.push(lte(auditLogs.createdAt, new Date(params.endDate)))

    const where = conditions.length > 0 ? and(...conditions) : undefined

    const [data, countResult] = await Promise.all([
      this.db.select().from(auditLogs)
        .where(where)
        .orderBy(desc(auditLogs.createdAt))
        .limit(pageSize)
        .offset(offset),
      this.db.select({ count: sql<number>`count(*)` }).from(auditLogs).where(where),
    ])

    return {
      data,
      total: Number(countResult[0]?.count || 0),
      page,
      pageSize,
    }
  }
}
