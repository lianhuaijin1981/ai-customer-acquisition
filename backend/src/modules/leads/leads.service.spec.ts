import { Test } from '@nestjs/testing'
import { LeadsService } from './leads.service'
import { AiService } from '../../common/services/ai.service'
import { DB_TOKEN } from '../../database/database.module'

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
    returning: jest.fn(),
  }

  // Default: all chain methods return self
  for (const method of ['select', 'from', 'where', 'and', 'orderBy', 'limit', 'offset', 'update', 'set', 'values', 'insert']) {
    db[method].mockImplementation(() => db)
  }

  return db
}

describe('LeadsService', () => {
  let service: LeadsService
  let aiService: AiService
  let db: any

  const mockAiService = {
    analyzeIntent: jest.fn(),
  }

  beforeEach(async () => {
    jest.clearAllMocks()
    db = createMockDb()
    mockAiService.analyzeIntent.mockReset()

    const module = await Test.createTestingModule({
      providers: [
        LeadsService,
        { provide: DB_TOKEN, useValue: db },
        { provide: AiService, useValue: mockAiService },
      ],
    }).compile()

    service = module.get(LeadsService)
    aiService = module.get(AiService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('findAll', () => {
    // The service does Promise.all([dataQuery, countQuery])
    // Data query:   select().from().where().orderBy().limit().offset() => offset resolves
    // Count query:  select().from().where() => where resolves
    // Both chains are started synchronously before any await.
    // Call order: select,from,where(data),orderBy,limit,offset  THEN select,from,where(count)
    // So where is called twice: 1st for data chain (should return db), 2nd for count (should resolve)

    it('should return paginated leads', async () => {
      const mockData = [
        { id: '1', platform: 'xiaohongshu', nickname: 'User1', status: 'new' },
        { id: '2', platform: 'weibo', nickname: 'User2', status: 'contacted' },
      ]

      db.where.mockReturnValueOnce(db).mockResolvedValueOnce([{ count: '2' }])
      db.offset.mockResolvedValueOnce(mockData)

      const result = await service.findAll({ page: 1, pageSize: 20 })
      expect(result.data).toEqual(mockData)
      expect(result.total).toBe(2)
      expect(result.page).toBe(1)
      expect(result.pageSize).toBe(20)
      expect(result.totalPages).toBe(1)
    })

    it('should return empty result when no leads match', async () => {
      db.where.mockReturnValueOnce(db).mockResolvedValueOnce([{ count: '0' }])
      db.offset.mockResolvedValueOnce([])

      const result = await service.findAll({ status: 'nonexistent' })
      expect(result.data).toEqual([])
      expect(result.total).toBe(0)
    })

    it('should calculate totalPages correctly', async () => {
      const mockData = Array(20).fill(null).map((_, i) => ({ id: String(i) }))

      db.where.mockReturnValueOnce(db).mockResolvedValueOnce([{ count: '55' }])
      db.offset.mockResolvedValueOnce(mockData)

      const result = await service.findAll({ page: 1, pageSize: 20 })
      expect(result.totalPages).toBe(3)
    })

    it('should use default page and pageSize', async () => {
      db.where.mockReturnValueOnce(db).mockResolvedValueOnce([{ count: '0' }])
      db.offset.mockResolvedValueOnce([])

      const result = await service.findAll({})
      expect(result.page).toBe(1)
      expect(result.pageSize).toBe(20)
    })
  })

  describe('findById', () => {
    it('should return a lead by id', async () => {
      const mockLead = { id: 'lead-1', nickname: 'TestUser' }
      db.where.mockResolvedValueOnce([mockLead])

      const result = await service.findById('lead-1')
      expect(result).toEqual(mockLead)
    })

    it('should return undefined for non-existent id', async () => {
      db.where.mockResolvedValueOnce([])

      const result = await service.findById('nonexistent')
      expect(result).toBeUndefined()
    })
  })

  describe('create', () => {
    it('should create a lead and return it', async () => {
      const created = { id: 'new-id', platform: 'xiaohongshu', nickname: 'NewUser' }
      db.returning.mockResolvedValueOnce([created])

      const result = await service.create({ platform: 'xiaohongshu', nickname: 'NewUser' })
      expect(result).toEqual(created)
      expect(db.insert).toHaveBeenCalled()
      expect(db.values).toHaveBeenCalledWith(expect.objectContaining({ platform: 'xiaohongshu' }))
    })

    it('should generate a UUID for new lead', async () => {
      db.returning.mockResolvedValueOnce([{ id: 'abc', platform: 'weibo' }])

      await service.create({ platform: 'weibo' })
      const valuesCall = db.values.mock.calls[0][0]
      expect(valuesCall.id).toBeDefined()
      expect(typeof valuesCall.id).toBe('string')
    })
  })

  describe('update', () => {
    it('should update a lead and return it', async () => {
      db.returning.mockResolvedValueOnce([{ id: 'lead-1', status: 'contacted' }])

      const result = await service.update('lead-1', { status: 'contacted' })
      expect(result.status).toBe('contacted')
      expect(db.update).toHaveBeenCalled()
    })

    it('should return undefined when updating non-existent lead', async () => {
      db.returning.mockResolvedValueOnce([])

      const result = await service.update('nonexistent', { status: 'contacted' })
      expect(result).toBeUndefined()
    })
  })

  describe('updateStatus', () => {
    it('should delegate to update with status', async () => {
      db.returning.mockResolvedValueOnce([{ id: 'lead-1', status: 'converted' }])

      await service.updateStatus('lead-1', 'converted')
      expect(db.update).toHaveBeenCalled()
    })
  })

  describe('getStats', () => {
    // getStats has 3 parallel queries:
    // 1. select({count}).from(leads)                    => resolves on from()
    // 2. select({count}).from(leads).where(todayFilter) => resolves on where()
    // 3. select({count}).from(leads).where(intentFilter) => resolves on where()
    // Call order: select,from(from=150), select,from,where(today), select,from,where(intent)

    it('should return aggregated stats', async () => {
      db.from.mockResolvedValueOnce([{ count: '150' }])
      db.where
        .mockResolvedValueOnce([{ count: '10' }])
        .mockResolvedValueOnce([{ count: '30' }])

      const result = await service.getStats()
      expect(result.total).toBe(150)
      expect(result.todayLeads).toBe(10)
      expect(result.highIntent).toBe(30)
    })

    it('should return zero stats when no data', async () => {
      db.from.mockResolvedValueOnce([{ count: '0' }])
      db.where
        .mockResolvedValueOnce([{ count: '0' }])
        .mockResolvedValueOnce([{ count: '0' }])

      const result = await service.getStats()
      expect(result).toEqual({ total: 0, todayLeads: 0, highIntent: 0 })
    })
  })

  describe('analyzeIntent', () => {
    it('should analyze intent using AI service', async () => {
      const mockLead = {
        id: 'lead-1', bio: 'AI expert', interactionContent: 'Interested',
        platform: 'xiaohongshu', followerCount: 5000,
      }

      const aiResult = {
        intentScore: 85, intentLevel: 'high', industry: 'tech',
        reasons: ['Strong interest shown'],
      }

      mockAiService.analyzeIntent.mockResolvedValue(aiResult)
      db.where.mockResolvedValueOnce([mockLead]) // findById
      db.returning.mockResolvedValueOnce([{ ...mockLead, ...aiResult }]) // update returning

      const result = await service.analyzeIntent('lead-1')
      expect(aiService.analyzeIntent).toHaveBeenCalledWith({
        bio: 'AI expert',
        interactionContent: 'Interested',
        platform: 'xiaohongshu',
        followerCount: 5000,
      })
      expect(result).toEqual(aiResult)
    })

    it('should return null for non-existent lead', async () => {
      db.where.mockResolvedValueOnce([])

      const result = await service.analyzeIntent('nonexistent')
      expect(result).toBeNull()
      expect(aiService.analyzeIntent).not.toHaveBeenCalled()
    })
  })

  describe('batchImport', () => {
    it('should import all items successfully', async () => {
      db.returning.mockResolvedValue([{ id: '1' }]) // always returns

      const items = [
        { platform: 'xiaohongshu', nickname: 'User1' },
        { platform: 'weibo', nickname: 'User2' },
      ]

      const result = await service.batchImport(items)
      expect(result.success).toBe(2)
      expect(result.failed).toBe(0)
      expect(result.errors).toHaveLength(0)
    })

    it('should track failures', async () => {
      db.returning
        .mockResolvedValueOnce([{ id: '1' }])
        .mockRejectedValueOnce(new Error('DB error'))

      const items = [
        { platform: 'xiaohongshu', nickname: 'User1' },
        { platform: 'weibo', nickname: 'User2' },
      ]

      const result = await service.batchImport(items)
      expect(result.success).toBe(1)
      expect(result.failed).toBe(1)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]).toBe('DB error')
    })

    it('should return all failures when every item fails', async () => {
      db.returning.mockRejectedValue(new Error('connection lost'))

      const result = await service.batchImport([{ platform: 'xiaohongshu' }])
      expect(result.success).toBe(0)
      expect(result.failed).toBe(1)
    })
  })
})
