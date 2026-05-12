import { Test } from '@nestjs/testing'
import { ExportService } from './export.service'
import { DB_TOKEN } from '../../database/database.module'
import { Response } from 'express'

describe('ExportService', () => {
  let service: ExportService
  let db: any

  const mockDb = {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    and: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
  }

  const mockResponse = (): Partial<Response> => {
    const res: any = {
      headers: {} as Record<string, string>,
      data: [] as Buffer[],
      setHeader: jest.fn((key: string, val: string) => { res.headers[key] = val }),
      write: jest.fn((chunk: any) => { res.data.push(Buffer.from(chunk)) }),
      end: jest.fn(),
    }
    return res as Partial<Response>
  }

  beforeEach(async () => {
    jest.clearAllMocks()

    mockDb.select.mockReturnThis()
    mockDb.from.mockReturnThis()
    mockDb.where.mockReturnThis()
    mockDb.and.mockReturnThis()
    mockDb.orderBy.mockReturnThis()
    mockDb.limit.mockReturnThis()

    const module = await Test.createTestingModule({
      providers: [
        ExportService,
        { provide: DB_TOKEN, useValue: mockDb },
      ],
    }).compile()

    service = module.get(ExportService)
    db = module.get(DB_TOKEN)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('export - CSV format', () => {
    it('should export leads as CSV', async () => {
      const mockLeads = [
        {
          id: '1', platform: 'xiaohongshu', platformUserId: 'usr1', nickname: 'User1',
          intentScore: 80, intentLevel: 'high', status: 'new', industry: 'tech',
          location: 'Beijing', followerCount: 5000, tags: ['tag1'], createdAt: '2025-01-01T00:00:00Z',
        },
      ]

      mockDb.limit.mockResolvedValue(mockLeads)

      const res = mockResponse()
      await service.export(res as Response, { type: 'leads', format: 'csv' })

      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv; charset=utf-8')
      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        expect.stringContaining('.csv'),
      )
      expect(res.write).toHaveBeenCalled()
      expect(res.end).toHaveBeenCalled()
    })

    it('should export outreach_tasks as CSV', async () => {
      const mockTasks = [
        {
          id: 't1', name: 'Task1', platform: 'xiaohongshu', status: 'running',
          dailyLimit: 100, totalTarget: 1000, totalSent: 200, totalReplied: 50,
          totalConverted: 10, createdAt: '2025-01-01T00:00:00Z',
        },
      ]

      mockDb.limit.mockResolvedValue(mockTasks)

      const res = mockResponse()
      await service.export(res as Response, { type: 'outreach_tasks', format: 'csv' })

      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv; charset=utf-8')
      expect(res.end).toHaveBeenCalled()
    })

    it('should export customers as CSV', async () => {
      const mockCustomers = [
        {
          id: 'c1', leadId: 'l1', wechatId: 'wx1', name: 'Customer1',
          sourcePlatform: 'xiaohongshu', status: 'active', tier: 'A',
          intentScore: 90, tags: ['vip'], addedAt: '2025-01-01', lastInteractAt: '2025-01-02',
          notes: 'VIP customer', createdAt: '2025-01-01T00:00:00Z',
        },
      ]

      mockDb.limit.mockResolvedValue(mockCustomers)

      const res = mockResponse()
      await service.export(res as Response, { type: 'customers', format: 'csv' })

      expect(res.end).toHaveBeenCalled()
    })

    it('should export templates as CSV', async () => {
      const mockTemplates = [
        {
          id: 'tpl1', name: 'Template1', industry: 'tech', scene: 'first_contact',
          status: 'active', useCount: 10, replyCount: 3, replyRate: 0.3,
          variables: ['name'], content: 'Hello {{name}}', createdAt: '2025-01-01T00:00:00Z',
        },
      ]

      mockDb.limit.mockResolvedValue(mockTemplates)

      const res = mockResponse()
      await service.export(res as Response, { type: 'templates', format: 'csv' })

      expect(res.end).toHaveBeenCalled()
    })
  })

  describe('export - Excel format', () => {
    it('should export leads as Excel', async () => {
      const mockLeads = [
        {
          id: '1', platform: 'xiaohongshu', platformUserId: 'usr1', nickname: 'User1',
          intentScore: 80, intentLevel: 'high', status: 'new', industry: 'tech',
          location: 'Beijing', followerCount: 5000, tags: ['tag1'], createdAt: '2025-01-01T00:00:00Z',
        },
      ]

      mockDb.limit.mockResolvedValue(mockLeads)

      const res = mockResponse()
      await service.export(res as Response, { type: 'leads', format: 'excel' })

      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      )
      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        expect.stringContaining('.xlsx'),
      )
      expect(res.end).toHaveBeenCalled()
    })

    it('should export analytics as Excel', async () => {
      const mockAnalytics = [
        {
          date: '2025-01-01', platform: 'xiaohongshu', leadsCount: 50,
          sentCount: 200, replyCount: 30, addWechatCount: 10, convertCount: 5,
          replyRate: 0.15, addWechatRate: 0.05, convertRate: 0.025, cost: 500,
        },
      ]

      mockDb.limit.mockResolvedValue(mockAnalytics)

      const res = mockResponse()
      await service.export(res as Response, { type: 'analytics', format: 'excel' })

      expect(res.end).toHaveBeenCalled()
    })

    it('should export outreach_logs as Excel', async () => {
      const mockLogs = [
        {
          id: 'log1', taskId: 't1', leadId: 'l1', accountId: 'a1', templateId: 'tpl1',
          messageContent: 'Hello', status: 'sent', sentAt: '2025-01-01T00:00:00Z',
          repliedAt: null, replyContent: null, createdAt: '2025-01-01T00:00:00Z',
        },
      ]

      mockDb.limit.mockResolvedValue(mockLogs)

      const res = mockResponse()
      await service.export(res as Response, { type: 'outreach_logs', format: 'excel' })

      expect(res.end).toHaveBeenCalled()
    })
  })

  describe('export - empty data', () => {
    it('should export empty leads data as CSV', async () => {
      mockDb.limit.mockResolvedValue([])

      const res = mockResponse()
      await service.export(res as Response, { type: 'leads', format: 'csv' })

      expect(res.end).toHaveBeenCalled()
      // Should still write header row
      expect(res.write).toHaveBeenCalled()
    })
  })

  describe('export - with filters', () => {
    it('should apply platform filter for leads export', async () => {
      mockDb.limit.mockResolvedValue([])

      const res = mockResponse()
      await service.export(res as Response, {
        type: 'leads',
        format: 'csv',
        platform: 'xiaohongshu',
        status: 'new',
        startDate: '2025-01-01',
      })

      expect(db.from).toHaveBeenCalled()
      expect(res.end).toHaveBeenCalled()
    })
  })
})
