import { Test } from '@nestjs/testing'
import { ConfigService } from '@nestjs/config'
import { RiskService } from './risk.service'

// Mock database
const mockDb = {
  select: jest.fn().mockReturnThis(),
  from: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  values: jest.fn().mockResolvedValue(undefined),
  update: jest.fn().mockReturnThis(),
  set: jest.fn().mockReturnThis(),
  returning: jest.fn().mockResolvedValue([{}]),
}

const DB_TOKEN = 'DATABASE_CONNECTION'

describe('RiskService', () => {
  let service: RiskService

  beforeEach(async () => {
    // Reset mocks
    mockDb.select.mockReturnThis()
    mockDb.from.mockReturnThis()
    mockDb.where.mockReturnThis()
    mockDb.limit.mockReturnThis()

    const module = await Test.createTestingModule({
      providers: [
        RiskService,
        { provide: DB_TOKEN, useValue: mockDb },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'REDIS_URL') return undefined // use memory counters
              return undefined
            }),
          },
        },
      ],
    }).compile()

    service = module.get(RiskService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('checkBeforeSend', () => {
    it('should allow send when all checks pass', async () => {
      // Mock: no applicable rule found (use default)
      mockDb.select.mockReturnThis()
      mockDb.where.mockReturnThis()
      mockDb.limit.mockResolvedValueOnce([]) // platformRule
      mockDb.limit.mockResolvedValueOnce([]) // globalRule
      mockDb.limit.mockResolvedValueOnce([{ riskScore: 0, status: 'active' }]) // account

      const result = await service.checkBeforeSend({
        accountId: 'acc-1',
        platform: 'weibo',
        messageContent: '你好，想了解一下产品',
      })
      expect(result.allowed).toBe(true)
      expect(result.riskLevel).toBe('low')
    })

    it('should block send when daily limit exceeded', async () => {
      mockDb.limit.mockResolvedValueOnce([]) // platformRule
      mockDb.limit.mockResolvedValueOnce([]) // globalRule

      // Simulate 200 sends already done
      const sendReq = { accountId: 'acc-limited', platform: 'weibo', messageContent: 'test' }
      for (let i = 0; i < 200; i++) {
        await service.recordSent('acc-limited').catch(() => {})
      }

      const result = await service.checkBeforeSend(sendReq)
      expect(result.allowed).toBe(false)
      expect(result.reason).toContain('上限')
    }, 10000)

    it('should block send with sensitive content', async () => {
      mockDb.limit.mockResolvedValueOnce([]) // platformRule
      mockDb.limit.mockResolvedValueOnce([]) // globalRule
      mockDb.limit.mockResolvedValueOnce([{ riskScore: 0, status: 'active' }]) // account

      const result = await service.checkBeforeSend({
        accountId: 'acc-2',
        platform: 'weibo',
        messageContent: '快来贷款吧',
      })
      expect(result.allowed).toBe(false)
      expect(result.riskLevel).toBe('high')
    })

    it('should block banned accounts', async () => {
      mockDb.limit.mockResolvedValueOnce([])
      mockDb.limit.mockResolvedValueOnce([])
      mockDb.limit.mockResolvedValueOnce([{ riskScore: 100, status: 'banned' }])

      const result = await service.checkBeforeSend({
        accountId: 'acc-banned',
        platform: 'weibo',
        messageContent: 'hello',
      })
      expect(result.allowed).toBe(false)
      expect(result.riskLevel).toBe('critical')
    })
  })

  describe('recordEvent', () => {
    it('should insert risk event', async () => {
      await service.recordEvent({
        type: 'test_event',
        level: 'medium',
        accountId: 'acc-1',
        platform: 'weibo',
        description: 'test description',
      })
      expect(mockDb.values).toHaveBeenCalled()
    })
  })

  describe('getStats', () => {
    it('should return risk stats', async () => {
      mockDb.select.mockReturnThis()
      mockDb.from.mockReturnThis()
      mockDb.where.mockReturnThis()
      mockDb.limit.mockResolvedValueOnce([])
      mockDb.limit.mockResolvedValueOnce([])

      // Count queries
      mockDb.where.mockResolvedValueOnce([{ count: 5 }]) // unresolved
      mockDb.where.mockResolvedValueOnce([{ count: 3 }]) // todayEvents
      mockDb.where.mockResolvedValueOnce([{ count: 2 }]) // resolved
      mockDb.from.mockResolvedValueOnce([{ riskScore: 10 }, { riskScore: 30 }]) // accounts

      const stats = await service.getStats()
      expect(stats).toHaveProperty('unresolvedCount')
      expect(stats).toHaveProperty('accountHealthScore')
    })
  })
})
