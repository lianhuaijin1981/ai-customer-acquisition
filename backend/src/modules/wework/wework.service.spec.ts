import { Test } from '@nestjs/testing'
import { NotFoundException, BadRequestException } from '@nestjs/common'
import { WeworkService } from './wework.service'
import { DB_TOKEN } from '../../database/database.module'

jest.mock('axios')

function createMockDb() {
  const db: any = {
    select: jest.fn(),
    from: jest.fn(),
    where: jest.fn(),
    and: jest.fn(),
    orderBy: jest.fn(),
    limit: jest.fn(),
    offset: jest.fn(),
    insert: jest.fn(),
    values: jest.fn(),
    update: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    returning: jest.fn(),
  }

  const chainMethods = ['select', 'from', 'where', 'and', 'orderBy', 'limit', 'offset', 'update', 'set', 'values']
  for (const method of chainMethods) {
    db[method].mockImplementation(() => db)
  }

  return db
}

describe('WeworkService', () => {
  let service: WeworkService
  let db: any

  const mockConfig = { id: 'cfg-1', corpId: 'mock_corp', accessToken: null, tokenExpiresAt: null }

  beforeEach(async () => {
    jest.clearAllMocks()
    db = createMockDb()

    const module = await Test.createTestingModule({
      providers: [
        WeworkService,
        { provide: DB_TOKEN, useValue: db },
      ],
    }).compile()

    service = module.get(WeworkService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('getConfigs', () => {
    it('should return list of configs', async () => {
      const mockConfigs = [{ id: 'cfg-1', corpId: 'corp1', corpName: 'Corp 1', status: 'active' }]
      db.orderBy.mockResolvedValueOnce(mockConfigs)

      const result = await service.getConfigs()
      expect(result).toEqual(mockConfigs)
    })

    it('should return empty array when no configs', async () => {
      db.orderBy.mockResolvedValueOnce([])
      expect(await service.getConfigs()).toEqual([])
    })
  })

  describe('createConfig', () => {
    it('should create a new config with inactive status', async () => {
      const created = { id: 'cfg-1', corpId: 'corp1', status: 'inactive' }
      db.values.mockReturnValue(db)
      db.returning.mockResolvedValueOnce([created])

      const result = await service.createConfig({
        corpId: 'corp1', corpName: 'My Corp', agentId: '1001', secret: 'my-secret',
      })

      expect(result).toEqual(created)
      expect(result.status).toBe('inactive')
      expect(db.insert).toHaveBeenCalled()
      expect(db.values).toHaveBeenCalledWith(expect.objectContaining({ corpId: 'corp1' }))
    })

    it('should work without corpName', async () => {
      db.values.mockReturnValue(db)
      db.returning.mockResolvedValueOnce([{ id: 'cfg-2', status: 'inactive' }])

      const result = await service.createConfig({ corpId: 'corp2', agentId: '1002', secret: 'secret' })
      expect(result.status).toBe('inactive')
    })
  })

  describe('deleteConfig', () => {
    it('should delete a config', async () => {
      db.where.mockReturnValue(db)
      const result = await service.deleteConfig('cfg-1')
      expect(result.success).toBe(true)
    })
  })

  describe('addFriend', () => {
    it('should add friend with wechatId in mock mode', async () => {
      db.values.mockReturnValue(db)
      db.where
        .mockResolvedValueOnce([mockConfig]) // getAccessToken
        .mockReturnValueOnce(db)             // update status (write chain)
        .mockResolvedValueOnce(undefined)

      const result = await service.addFriend({
        configId: 'cfg-1', wechatId: 'wx_user_1', remark: 'AI contact',
      })

      expect(result.success).toBe(true)
      expect(result.requestId).toBeDefined()
    })

    it('should add friend with externalUserId', async () => {
      db.values.mockReturnValue(db)
      db.where
        .mockResolvedValueOnce([mockConfig])
        .mockReturnValueOnce(db)
        .mockResolvedValueOnce(undefined)

      const result = await service.addFriend({ configId: 'cfg-1', externalUserId: 'ext_user_1' })
      expect(result.success).toBe(true)
    })

    it('should resolve wechatId from leadId', async () => {
      const lead = { id: 'lead-1', platformUserId: 'wx_from_lead' }

      db.values.mockReturnValue(db)
      db.where
        .mockResolvedValueOnce([lead])       // find lead
        .mockResolvedValueOnce([mockConfig]) // getAccessToken
        .mockReturnValueOnce(db)             // update status (write chain)
        .mockResolvedValueOnce(undefined)

      const result = await service.addFriend({ configId: 'cfg-1', leadId: 'lead-1' })
      expect(result.success).toBe(true)
    })

    it('should throw BadRequestException when no wechatId and no externalUserId', async () => {
      db.where.mockResolvedValueOnce([]) // lead not found

      await expect(service.addFriend({
        configId: 'cfg-1', leadId: 'nonexistent',
      })).rejects.toThrow(BadRequestException)
    })

    it('should throw NotFoundException when config not found', async () => {
      db.where.mockResolvedValueOnce([]) // config not found

      await expect(service.addFriend({
        configId: 'nonexistent', externalUserId: 'ext_1',
      })).rejects.toThrow(NotFoundException)
    })
  })

  describe('sendMessage', () => {
    it('should send message successfully in mock mode', async () => {
      db.values.mockReturnValue(db)
      db.where
        .mockResolvedValueOnce([mockConfig]) // getAccessToken
        .mockReturnValueOnce(db)             // update status (write chain)
        .mockResolvedValueOnce(undefined)

      const result = await service.sendMessage({
        configId: 'cfg-1', toUserId: 'user-1', content: 'Hello!',
      })

      expect(result.success).toBe(true)
      expect(result.messageId).toBeDefined()
    })

    it('should record message with template and A/B test info', async () => {
      db.values.mockReturnValue(db)
      db.where
        .mockResolvedValueOnce([mockConfig])
        .mockReturnValueOnce(db)
        .mockResolvedValueOnce(undefined)

      await service.sendMessage({
        configId: 'cfg-1', toUserId: 'user-1', content: 'Hello!',
        templateId: 'tpl-1', abTestId: 'ab-1', abVariant: 'A', leadId: 'lead-1',
      })

      const insertValues = db.values.mock.calls[0][0]
      expect(insertValues.templateId).toBe('tpl-1')
      expect(insertValues.abTestId).toBe('ab-1')
      expect(insertValues.abVariant).toBe('A')
    })

    it('should throw NotFoundException for missing config', async () => {
      db.values.mockReturnValue(db)
      db.where.mockResolvedValueOnce([]) // config not found

      await expect(service.sendMessage({
        configId: 'nonexistent', toUserId: 'user-1', content: 'Hello!',
      })).rejects.toThrow(NotFoundException)
    })
  })

  describe('batchSendMessages', () => {
    it('should send to multiple users', async () => {
      db.values.mockReturnValue(db)
      // All getAccessToken calls return config; update status calls return db
      db.where
        .mockResolvedValue([mockConfig]) // always returns config
        .mockReturnValue(db)

      const result = await service.batchSendMessages({
        configId: 'cfg-1', userIds: ['user-1', 'user-2', 'user-3'], content: 'Batch!',
      })

      expect(result.success).toBe(3)
      expect(result.failed).toBe(0)
      expect(result.total).toBe(3)
    })

    it('should track failures in batch', async () => {
      let whereCallIdx = 0
      db.values.mockReturnValue(db)
      db.where.mockImplementation(() => {
        whereCallIdx++
        if (whereCallIdx === 3) return Promise.resolve([]) // 2nd user: config not found
        if (whereCallIdx % 2 === 1) return Promise.resolve([mockConfig]) // getAccessToken
        return db // write chain
      })

      const result = await service.batchSendMessages({
        configId: 'cfg-1', userIds: ['user-1', 'user-2'], content: 'Hello',
      })

      expect(result.success).toBe(1)
      expect(result.failed).toBe(1)
    })
  })

  describe('testConnection', () => {
    it('should return success in mock mode', async () => {
      db.where.mockResolvedValueOnce([mockConfig])

      const result = await service.testConnection('cfg-1')
      expect(result.success).toBe(true)
      expect(result.corpName).toContain('Mock')
    })
  })

  describe('getStats', () => {
    it('should return fallback stats on error', async () => {
      db.from.mockRejectedValueOnce(new Error('DB error'))

      const result = await service.getStats()
      expect(result.totalFriendRequests).toBe(128)
      expect(result.sentMessages).toBe(312)
    })

    it('should return stats from db', async () => {
      db.where.mockResolvedValue([{ total: 5 }])
      const result = await service.getStats()
      expect(result).toBeDefined()
    })
  })
})
