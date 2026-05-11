/**
 * 任务调度引擎
 * 功能：触达任务定时执行、数据采集调度、每日统计汇总、账号健康检查
 */

import { Injectable, Logger, Inject } from '@nestjs/common'
import { Cron, CronExpression, Interval } from '@nestjs/schedule'
import { DB_TOKEN } from '../../database/database.module'
import { outreachTasks, outreachLogs, leads, accounts, templates, operationData } from '../../database/schema'
import { eq, and, lt, desc, count, lte, sql } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import dayjs from 'dayjs'
import { RiskService } from '../risk/risk.service'

// 执行状态内存映射
interface TaskExecState {
  taskId: string
  currentIndex: number
  leadIds: string[]
  lastExecutedAt: number
}

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name)
  private readonly taskStates: Map<string, TaskExecState> = new Map()

  constructor(
    @Inject(DB_TOKEN) private db: any,
    private riskService: RiskService,
  ) {}

  // ========== 每分钟检查并执行待发任务 ==========
  @Interval(60000) // 每 60 秒
  async executeOutreachTasks() {
    const runningTasks = await this.db
      .select()
      .from(outreachTasks)
      .where(eq(outreachTasks.status, 'running'))

    for (const task of runningTasks) {
      await this.executeTask(task).catch(err =>
        this.logger.error(`[调度] 任务 ${task.id} 执行出错: ${err.message}`)
      )
    }
  }

  // ========== 执行单个触达任务 ==========
  async executeTask(task: any) {
    const state = this.taskStates.get(task.id) ?? await this.initTaskState(task)
    if (!state) return

    const accountIds: string[] = task.accountIds ?? []
    if (!accountIds.length) {
      this.logger.warn(`[调度] 任务 ${task.id} 没有分配账号，跳过`)
      return
    }

    // 选择本次使用的账号（轮换）
    const accountIndex = (state.currentIndex) % accountIds.length
    const accountId = accountIds[accountIndex]

    // 获取下一条待触达的线索
    if (state.currentIndex >= state.leadIds.length) {
      this.logger.log(`[调度] 任务 ${task.id} 线索已全部处理`)
      await this.db.update(outreachTasks)
        .set({ status: 'completed', updatedAt: new Date() })
        .where(eq(outreachTasks.id, task.id))
      return
    }

    const leadId = state.leadIds[state.currentIndex]

    // 风控检查
    const riskCheck = await this.riskService.checkBeforeSend({
      accountId,
      platform: task.platform,
      messageContent: '待发送内容', // 实际场景从模板渲染
    })

    if (!riskCheck.allowed) {
      this.logger.warn(`[调度] 任务 ${task.id} 风控拦截: ${riskCheck.reason}`)
      if (riskCheck.suggestedDelay) {
        // 等待建议延迟后继续
        return
      }
      return
    }

    // 获取话术内容
    let messageContent = ''
    if (task.templateId) {
      const [tmpl] = await this.db.select({ content: templates.content })
        .from(templates)
        .where(eq(templates.id, task.templateId))
        .limit(1)

      if (tmpl) {
        const [lead] = await this.db.select().from(leads).where(eq(leads.id, leadId)).limit(1)
        messageContent = this.renderTemplate(tmpl.content, { nickname: lead?.nickname ?? '朋友' })
      }
    }

    // 记录发送日志
    const logId = uuidv4()
    await this.db.insert(outreachLogs).values({
      id: logId,
      taskId: task.id,
      leadId,
      accountId,
      templateId: task.templateId,
      messageContent,
      status: 'sent',
      sentAt: new Date(),
    })

    // 更新任务统计
    await this.db.update(outreachTasks)
      .set({
        totalSent: sql`total_sent + 1`,
        updatedAt: new Date(),
      })
      .where(eq(outreachTasks.id, task.id))

    // 更新风控计数
    await this.riskService.recordSent(accountId)

    // 更新账号今日发送量
    await this.db.update(accounts)
      .set({ todaySent: sql`today_sent + 1`, lastActiveAt: new Date(), updatedAt: new Date() })
      .where(eq(accounts.id, accountId))

    // 更新状态
    state.currentIndex++
    state.lastExecutedAt = Date.now()
    this.taskStates.set(task.id, state)

    this.logger.log(`[调度] 任务 ${task.id} 发送第 ${state.currentIndex}/${state.leadIds.length} 条`)
  }

  // ========== 初始化任务执行状态 ==========
  private async initTaskState(task: any): Promise<TaskExecState | null> {
    // 查询符合条件的线索 ID 列表
    const filter: any = task.leadFilter ?? {}
    const rows = await this.db
      .select({ id: leads.id })
      .from(leads)
      .where(
        and(
          eq(leads.platform, task.platform),
          eq(leads.status, 'new'),
        )
      )
      .limit(task.totalTarget || 1000)
      .orderBy(desc(leads.intentScore))

    if (!rows.length) {
      this.logger.warn(`[调度] 任务 ${task.id} 没有符合条件的线索`)
      return null
    }

    const state: TaskExecState = {
      taskId: task.id,
      currentIndex: 0,
      leadIds: rows.map((r: any) => r.id),
      lastExecutedAt: 0,
    }

    this.taskStates.set(task.id, state)
    this.logger.log(`[调度] 任务 ${task.id} 初始化完成，共 ${rows.length} 条线索`)
    return state
  }

  // ========== 每天 0 点重置账号日发送量 ==========
  @Cron('0 0 * * *', { name: 'reset-daily-count', timeZone: 'Asia/Shanghai' })
  async resetDailyCount() {
    this.logger.log('[调度] 重置账号日发送量')
    await this.db.update(accounts).set({ todaySent: 0, updatedAt: new Date() })
  }

  // ========== 每天 23:50 汇总当日运营数据 ==========
  @Cron('50 23 * * *', { name: 'daily-summary', timeZone: 'Asia/Shanghai' })
  async generateDailySummary() {
    const today = dayjs().format('YYYY-MM-DD')
    this.logger.log(`[调度] 生成 ${today} 运营日报`)

    // 统计今日各平台发送/回复数据
    const platforms = ['weibo', 'xiaohongshu']
    for (const platform of platforms) {
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)

      const logs = await this.db
        .select()
        .from(outreachLogs)
        .where(
          and(
            eq(outreachLogs.status, 'sent'),
          )
        )

      const sent = logs.length
      const replied = logs.filter((l: any) => l.repliedAt).length

      if (sent > 0) {
        try {
          await this.db.insert(operationData).values({
            date: today,
            platform,
            sentCount: sent,
            replyCount: replied,
            replyRate: replied / sent,
          })
        } catch {
          // ignore duplicates
        }
      }
    }
  }

  // ========== 每小时账号健康检查 ==========
  @Cron(CronExpression.EVERY_HOUR, { name: 'account-health-check', timeZone: 'Asia/Shanghai' })
  async accountHealthCheck() {
    const activeAccounts = await this.db
      .select()
      .from(accounts)
      .where(eq(accounts.status, 'active'))

    for (const account of activeAccounts) {
      // 风险分过高，自动限制
      if ((account.riskScore ?? 0) >= 80 && account.status !== 'restricted') {
        await this.db.update(accounts)
          .set({ status: 'restricted', updatedAt: new Date() })
          .where(eq(accounts.id, account.id))

        await this.riskService.recordEvent({
          type: 'auto_restricted',
          level: 'high',
          accountId: account.id,
          platform: account.platform,
          description: `账号风险分达到 ${account.riskScore}，已自动限制`,
        })

        this.logger.warn(`[健康检查] 账号 ${account.username} 风险分过高，已自动限制`)
      }
    }
  }

  // ========== 话术变量渲染 ==========
  private renderTemplate(template: string, variables: Record<string, string>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] ?? `{{${key}}}`)
  }

  // ========== 获取调度引擎状态 ==========
  getEngineStatus() {
    return {
      runningTasks: this.taskStates.size,
      taskStates: Array.from(this.taskStates.entries()).map(([id, state]) => ({
        taskId: id,
        progress: `${state.currentIndex}/${state.leadIds.length}`,
        lastExecutedAt: state.lastExecutedAt ? new Date(state.lastExecutedAt).toISOString() : null,
      })),
    }
  }
}
