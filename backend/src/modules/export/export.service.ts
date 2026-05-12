import { Injectable, Inject, Logger } from '@nestjs/common'
import { DB_TOKEN } from '../../database/database.module'
import { leads, outreachTasks, outreachLogs, customers, operationData, templates } from '../../database/schema'
import { desc, gte, and, SQL, eq } from 'drizzle-orm'
import { Response } from 'express'
import * as ExcelJS from 'exceljs'
import * as dayjs from 'dayjs'

type ExportType = 'leads' | 'outreach_tasks' | 'outreach_logs' | 'customers' | 'analytics' | 'templates'
type ExportFormat = 'excel' | 'csv'

@Injectable()
export class ExportService {
  private readonly logger = new Logger(ExportService.name)

  constructor(@Inject(DB_TOKEN) private db: any) {}

  // ==================== 主入口 ====================

  async export(res: Response, params: {
    type: ExportType
    format: ExportFormat
    startDate?: string
    endDate?: string
    platform?: string
    status?: string
  }) {
    const { type, format } = params
    const filename = `${type}_${dayjs().format('YYYYMMDD_HHmmss')}`

    const { headers, rows } = await this.getData(type, params)

    if (format === 'csv') {
      this.sendCsv(res, filename, headers, rows)
    } else {
      await this.sendExcel(res, filename, type, headers, rows)
    }
  }

  // ==================== 数据获取 ====================

  private async getData(type: ExportType, params: any): Promise<{ headers: string[]; rows: any[][] }> {
    switch (type) {
      case 'leads': return this.getLeadsData(params)
      case 'outreach_tasks': return this.getOutreachTasksData(params)
      case 'outreach_logs': return this.getOutreachLogsData(params)
      case 'customers': return this.getCustomersData(params)
      case 'analytics': return this.getAnalyticsData(params)
      case 'templates': return this.getTemplatesData(params)
      default: return { headers: [], rows: [] }
    }
  }

  private async getLeadsData(params: any) {
    const conditions: SQL[] = []
    if (params.platform) conditions.push(eq(leads.platform, params.platform))
    if (params.status) conditions.push(eq(leads.status, params.status))
    if (params.startDate) conditions.push(gte(leads.createdAt, new Date(params.startDate)))
    const where = conditions.length > 0 ? and(...conditions) : undefined

    const data = await this.db.select().from(leads).where(where).orderBy(desc(leads.createdAt)).limit(10000)

    const headers = ['ID', '平台', '用户ID', '昵称', '意向评分', '意向等级', '状态', '行业', '地区', '粉丝数', '标签', '创建时间']
    const rows = data.map((r: any) => [
      r.id, r.platform, r.platformUserId, r.nickname || '',
      r.intentScore, r.intentLevel, r.status, r.industry || '', r.location || '',
      r.followerCount, (r.tags || []).join(','),
      dayjs(r.createdAt).format('YYYY-MM-DD HH:mm:ss'),
    ])
    return { headers, rows }
  }

  private async getOutreachTasksData(params: any) {
    const conditions: SQL[] = []
    if (params.platform) conditions.push(eq(outreachTasks.platform, params.platform))
    if (params.status) conditions.push(eq(outreachTasks.status, params.status))
    const where = conditions.length > 0 ? and(...conditions) : undefined

    const data = await this.db.select().from(outreachTasks).where(where).orderBy(desc(outreachTasks.createdAt)).limit(5000)

    const headers = ['任务ID', '任务名称', '平台', '状态', '每日上限', '总目标', '已发送', '已回复', '已转化', '回复率', '转化率', '创建时间']
    const rows = data.map((r: any) => [
      r.id, r.name, r.platform, r.status,
      r.dailyLimit, r.totalTarget, r.totalSent, r.totalReplied, r.totalConverted,
      r.totalSent > 0 ? `${((r.totalReplied / r.totalSent) * 100).toFixed(1)}%` : '0%',
      r.totalSent > 0 ? `${((r.totalConverted / r.totalSent) * 100).toFixed(1)}%` : '0%',
      dayjs(r.createdAt).format('YYYY-MM-DD HH:mm:ss'),
    ])
    return { headers, rows }
  }

  private async getOutreachLogsData(params: any) {
    const conditions: SQL[] = []
    if (params.status) conditions.push(eq(outreachLogs.status, params.status))
    if (params.startDate) conditions.push(gte(outreachLogs.createdAt, new Date(params.startDate)))
    const where = conditions.length > 0 ? and(...conditions) : undefined

    const data = await this.db.select().from(outreachLogs).where(where).orderBy(desc(outreachLogs.createdAt)).limit(50000)

    const headers = ['记录ID', '任务ID', '线索ID', '账号ID', '模板ID', '发送内容', '状态', '发送时间', '回复时间', '回复内容']
    const rows = data.map((r: any) => [
      r.id, r.taskId, r.leadId, r.accountId, r.templateId || '',
      r.messageContent || '', r.status,
      r.sentAt ? dayjs(r.sentAt).format('YYYY-MM-DD HH:mm:ss') : '',
      r.repliedAt ? dayjs(r.repliedAt).format('YYYY-MM-DD HH:mm:ss') : '',
      r.replyContent || '',
    ])
    return { headers, rows }
  }

  private async getCustomersData(params: any) {
    const conditions: SQL[] = []
    if (params.status) conditions.push(eq(customers.status, params.status))
    if (params.startDate) conditions.push(gte(customers.createdAt, new Date(params.startDate)))
    const where = conditions.length > 0 ? and(...conditions) : undefined

    const data = await this.db.select().from(customers).where(where).orderBy(desc(customers.createdAt)).limit(10000)

    const headers = ['客户ID', '线索ID', '微信ID', '姓名', '来源平台', '状态', '客户等级', '意向评分', '标签', '添加时间', '最后互动时间', '备注']
    const rows = data.map((r: any) => [
      r.id, r.leadId || '', r.wechatId || '', r.name || '', r.sourcePlatform || '',
      r.status, r.tier, r.intentScore, (r.tags || []).join(','),
      r.addedAt ? dayjs(r.addedAt).format('YYYY-MM-DD HH:mm:ss') : '',
      r.lastInteractAt ? dayjs(r.lastInteractAt).format('YYYY-MM-DD HH:mm:ss') : '',
      r.notes || '',
    ])
    return { headers, rows }
  }

  private async getAnalyticsData(params: any) {
    const conditions: SQL[] = []
    if (params.startDate) conditions.push(gte(operationData.createdAt, new Date(params.startDate)))
    if (params.platform) conditions.push(eq(operationData.platform, params.platform))
    const where = conditions.length > 0 ? and(...conditions) : undefined

    const data = await this.db.select().from(operationData).where(where).orderBy(desc(operationData.date)).limit(365)

    const headers = ['日期', '平台', '新增线索', '发送量', '回复量', '加微信量', '转化量', '回复率', '加微率', '转化率', '成本']
    const rows = data.map((r: any) => [
      r.date, r.platform || 'all', r.leadsCount, r.sentCount, r.replyCount,
      r.addWechatCount, r.convertCount,
      `${(r.replyRate * 100).toFixed(1)}%`,
      `${(r.addWechatRate * 100).toFixed(1)}%`,
      `${(r.convertRate * 100).toFixed(1)}%`,
      r.cost,
    ])
    return { headers, rows }
  }

  private async getTemplatesData(params: any) {
    const data = await this.db.select().from(templates).orderBy(desc(templates.useCount)).limit(1000)

    const headers = ['模板ID', '模板名称', '行业', '场景', '状态', '使用次数', '回复次数', '回复率', '变量', '内容摘要', '创建时间']
    const rows = data.map((r: any) => [
      r.id, r.name, r.industry || '', r.scene, r.status,
      r.useCount, r.replyCount, `${(r.replyRate * 100).toFixed(1)}%`,
      (r.variables || []).join(','),
      (r.content || '').slice(0, 50) + ((r.content || '').length > 50 ? '...' : ''),
      dayjs(r.createdAt).format('YYYY-MM-DD HH:mm:ss'),
    ])
    return { headers, rows }
  }

  // ==================== CSV 输出 ====================

  private sendCsv(res: Response, filename: string, headers: string[], rows: any[][]) {
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}.csv"`)

    // BOM for Excel UTF-8
    res.write('\uFEFF')
    res.write(headers.map(h => `"${h}"`).join(',') + '\r\n')
    for (const row of rows) {
      res.write(row.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',') + '\r\n')
    }
    res.end()
  }

  // ==================== Excel 输出 ====================

  private async sendExcel(res: Response, filename: string, title: string, headers: string[], rows: any[][]) {
    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'AI 获客平台'
    workbook.created = new Date()

    const sheet = workbook.addWorksheet(title, {
      views: [{ state: 'frozen', ySplit: 1 }],
    })

    // 表头样式
    sheet.columns = headers.map((h, i) => ({
      header: h,
      key: `col${i}`,
      width: Math.max(12, h.length * 2),
    }))

    const headerRow = sheet.getRow(1)
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } }
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' }
    headerRow.height = 22

    // 数据行
    for (let i = 0; i < rows.length; i++) {
      const row = sheet.addRow(rows[i])
      if (i % 2 === 0) {
        row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F4FF' } }
      }
      row.alignment = { vertical: 'middle' }
    }

    // 边框
    sheet.eachRow(row => {
      row.eachCell(cell => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        }
      })
    })

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}.xlsx"`)

    await workbook.xlsx.write(res)
    res.end()
  }
}
