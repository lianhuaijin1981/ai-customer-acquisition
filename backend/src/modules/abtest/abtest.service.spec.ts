import { Test } from '@nestjs/testing'
import { NotFoundException } from '@nestjs/common'
import { AbTestService } from './abtest.service'
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
    delete: jest.fn(),
    returning: jest.fn(),
  }

  // Build a chain that returns `this` by default
  const chainMethods = ['select', 'from', 'where', 'and', 'orderBy', 'limit', 'offset', 'update', 'set', 'values']
  for (const method of chainMethods) {
    db[method].mockImplementation(() => db)
  }

  return db
}

describe('AbTestService', () => {
  let service: AbTestService
  let db: any

  beforeEach(async () => {
    jest.clearAllMocks()
    db = createMockDb()

    const module = await Test.createTestingModule({
      providers: [
        AbTestService,
        { provide: DB_TOKEN, useValue: db },
      ],
    }).compile()

    service = module.get(AbTestService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('findAll', () => {
    it('should return paginated A/B tests with variants', async () => {
      const mockTests = [{ id: 'test-1', name: 'Test 1', status: 'running', splitRatio: 0.5 }]
      const mockVariants = [
        { testId: 'test-1', variant: 'A', content: 'Variant A' },
        { testId: 'test-1', variant: 'B', content: 'Variant B' },
      ]

      // Tests query: select().from().where().orderBy().limit().offset() -> offset resolves
      db.offset.mockResolvedValueOnce(mockTests)
      // Variants query: select().from().where() -> where resolves
      db.where.mockResolvedValueOnce(mockVariants)
      // Count query: select().from().where() -> where resolves
      db.where.mockResolvedValueOnce([{ total: 1 }])

      const result = await service.findAll({ page: 1, pageSize: 20 })
      expect(result.data).toHaveLength(1)
      expect(result.data[0].variants).toHaveLength(2)
      expect(result.total).toBe(1)
    })

    it('should return empty result when no tests exist', async () => {
      db.offset.mockResolvedValueOnce([])
      db.where.mockResolvedValueOnce([{ total: 0 }])

      const result = await service.findAll()
      expect(result.data).toEqual([])
      expect(result.total).toBe(0)
    })
  })

  describe('create', () => {
    it('should create a test with A/B variants', async () => {
      const testRecord = { id: 'test-1', name: 'New Test', status: 'draft', splitRatio: 0.5 }
      db.returning.mockResolvedValueOnce([testRecord])
      db.values.mockReturnValue(db) // keep chain for second insert call

      const result = await service.create({
        name: 'New Test',
        variantA: { content: 'Hello A' },
        variantB: { content: 'Hello B' },
      })

      expect(result.name).toBe('New Test')
      expect(result.status).toBe('draft')
      expect(result.variants).toHaveLength(2)
      expect(result.variants[0].variant).toBe('A')
      expect(result.variants[1].variant).toBe('B')
    })

    it('should set default split ratio to 0.5', async () => {
      db.returning.mockResolvedValueOnce([{ id: 'test-1', splitRatio: 0.5, status: 'draft' }])
      db.values.mockReturnValue(db)

      await service.create({ name: 'Test', variantA: { content: 'A' }, variantB: { content: 'B' } })
      const insertValues = db.values.mock.calls[0][0]
      expect(insertValues.splitRatio).toBe(0.5)
    })

    it('should use provided split ratio', async () => {
      db.returning.mockResolvedValueOnce([{ id: 'test-1', splitRatio: 0.7, status: 'draft' }])
      db.values.mockReturnValue(db)

      await service.create({ name: 'Test', splitRatio: 0.7, variantA: { content: 'A' }, variantB: { content: 'B' } })
      const insertValues = db.values.mock.calls[0][0]
      expect(insertValues.splitRatio).toBe(0.7)
    })

    it('should include template IDs in variants', async () => {
      db.returning.mockResolvedValueOnce([{ id: 'test-1', status: 'draft' }])
      db.values.mockReturnValue(db)

      await service.create({
        name: 'Test',
        variantA: { content: 'A', templateId: 'tpl-1' },
        variantB: { content: 'B', templateId: 'tpl-2' },
      })

      const variantValues = db.values.mock.calls[1][0]
      expect(variantValues[0].templateId).toBe('tpl-1')
      expect(variantValues[1].templateId).toBe('tpl-2')
    })
  })

  describe('updateStatus', () => {
    it('should transition test to running', async () => {
      const testRecord = { id: 'test-1', name: 'Test', status: 'running' }

      db.returning.mockResolvedValue([testRecord])
      db.where
        .mockReturnValueOnce(db)          // update where (chain)
        .mockResolvedValueOnce([testRecord]) // findById
        .mockResolvedValueOnce([
          { variant: 'A', content: 'A' },
          { variant: 'B', content: 'B' },
        ])

      const result = await service.updateStatus('test-1', 'running')
      expect(result.status).toBe('running')
    })

    it('should transition test to completed', async () => {
      const testRecord = { id: 'test-1', name: 'Test', status: 'completed' }

      db.returning.mockResolvedValue([testRecord])
      db.where
        .mockReturnValueOnce(db)
        .mockResolvedValueOnce([testRecord])
        .mockResolvedValueOnce([
          { variant: 'A', content: 'A' },
          { variant: 'B', content: 'B' },
        ])

      const result = await service.updateStatus('test-1', 'completed')
      expect(result.status).toBe('completed')
    })
  })

  describe('pickVariant', () => {
    it('should consistently return the same variant for the same user', () => {
      const v1 = service.pickVariant('test-1', 'user-123', 0.5)
      const v2 = service.pickVariant('test-1', 'user-123', 0.5)
      expect(v1).toBe(v2)
    })

    it('should return A or B', () => {
      for (let i = 0; i < 100; i++) {
        expect(['A', 'B']).toContain(service.pickVariant('test-1', `user-${i}`, 0.5))
      }
    })

    it('should respect split ratio of 1.0 (all A)', () => {
      for (let i = 0; i < 50; i++) {
        expect(service.pickVariant('test-1', `user-${i}`, 1.0)).toBe('A')
      }
    })

    it('should respect split ratio of 0.0 (all B)', () => {
      for (let i = 0; i < 50; i++) {
        expect(service.pickVariant('test-1', `user-${i}`, 0.0)).toBe('B')
      }
    })
  })

  describe('recordSend / recordReply / recordConvert', () => {
    it('should record a send event', async () => {
      db.set.mockReturnValue(db)
      db.where.mockResolvedValueOnce([
        { variant: 'A', sentCount: 1, replyCount: 0, convertCount: 0, replyRate: 0, convertRate: 0 },
        { variant: 'B', sentCount: 0, replyCount: 0, convertCount: 0, replyRate: 0, convertRate: 0 },
      ])

      await service.recordSend('test-1', 'A')
      expect(db.update).toHaveBeenCalled()
    })

    it('should record a reply event', async () => {
      db.set.mockReturnValue(db)
      db.where.mockResolvedValueOnce([
        { variant: 'A', sentCount: 10, replyCount: 1, convertCount: 0, replyRate: 0.1, convertRate: 0 },
        { variant: 'B', sentCount: 10, replyCount: 0, convertCount: 0, replyRate: 0, convertRate: 0 },
      ])

      await service.recordReply('test-1', 'A')
      expect(db.update).toHaveBeenCalled()
    })

    it('should record a convert event', async () => {
      db.set.mockReturnValue(db)
      db.where.mockResolvedValueOnce([
        { variant: 'A', sentCount: 10, replyCount: 5, convertCount: 1, replyRate: 0.5, convertRate: 0.1 },
        { variant: 'B', sentCount: 10, replyCount: 3, convertCount: 0, replyRate: 0.3, convertRate: 0 },
      ])

      await service.recordConvert('test-1', 'A')
      expect(db.update).toHaveBeenCalled()
    })
  })

  describe('getAnalysis', () => {
    it('should return analysis with winner A', async () => {
      const mockTest = {
        id: 'test-1', name: 'Test', status: 'running', targetCount: 1000,
        variants: [
          { variant: 'A', sentCount: 100, replyCount: 20, convertCount: 5, replyRate: 0.2, convertRate: 0.05 },
          { variant: 'B', sentCount: 100, replyCount: 10, convertCount: 2, replyRate: 0.1, convertRate: 0.02 },
        ],
      }

      db.where
        .mockResolvedValueOnce([mockTest])
        .mockResolvedValueOnce(mockTest.variants)

      const result = await service.getAnalysis('test-1')
      expect(result.winner).toBe('A')
      expect(result.totalSent).toBe(200)
      expect(result.progress).toBe(20)
      expect(result.recommendation).toContain('A')
    })

    it('should declare B as winner when B has higher reply rate', async () => {
      const mockTest = {
        id: 'test-1', name: 'Test', targetCount: 200,
        variants: [
          { variant: 'A', sentCount: 100, replyCount: 5, replyRate: 0.05, convertRate: 0.01 },
          { variant: 'B', sentCount: 100, replyCount: 15, replyRate: 0.15, convertRate: 0.05 },
        ],
      }

      db.where
        .mockResolvedValueOnce([mockTest])
        .mockResolvedValueOnce(mockTest.variants)

      const result = await service.getAnalysis('test-1')
      expect(result.winner).toBe('B')
    })

    it('should return progress 0 when targetCount is 0', async () => {
      const mockTest = {
        id: 'test-1', name: 'Test', targetCount: 0,
        variants: [
          { variant: 'A', sentCount: 50, replyCount: 10, replyRate: 0.2, convertRate: 0.05 },
          { variant: 'B', sentCount: 50, replyCount: 8, replyRate: 0.16, convertRate: 0.04 },
        ],
      }

      db.where
        .mockResolvedValueOnce([mockTest])
        .mockResolvedValueOnce(mockTest.variants)

      const result = await service.getAnalysis('test-1')
      expect(result.progress).toBe(0)
    })

    it('should recommend expanding sample when variants are close', async () => {
      const mockTest = {
        id: 'test-1', name: 'Test', targetCount: 100,
        variants: [
          { variant: 'A', sentCount: 100, replyCount: 10, replyRate: 0.10, convertRate: 0.02 },
          { variant: 'B', sentCount: 100, replyCount: 11, replyRate: 0.11, convertRate: 0.03 },
        ],
      }

      db.where
        .mockResolvedValueOnce([mockTest])
        .mockResolvedValueOnce(mockTest.variants)

      const result = await service.getAnalysis('test-1')
      expect(result.recommendation).toContain('扩大样本量')
    })
  })

  describe('delete', () => {
    it('should delete test and its variants', async () => {
      db.where.mockReturnValue(db)
      const result = await service.delete('test-1')
      expect(result.success).toBe(true)
      expect(db.delete).toHaveBeenCalledTimes(2)
    })
  })

  describe('findById', () => {
    it('should throw NotFoundException for non-existent test', async () => {
      db.where.mockResolvedValueOnce([])
      await expect(service.findById('nonexistent')).rejects.toThrow(NotFoundException)
    })
  })

  describe('getStats', () => {
    it('should return aggregated stats', async () => {
      db.from.mockResolvedValueOnce([
        { status: 'running' },
        { status: 'completed' },
        { status: 'completed' },
        { status: 'draft' },
      ])

      const result = await service.getStats()
      expect(result.total).toBe(4)
      expect(result.running).toBe(1)
      expect(result.completed).toBe(2)
      expect(result.draft).toBe(1)
    })

    it('should return fallback stats on error', async () => {
      db.from.mockRejectedValueOnce(new Error('DB error'))

      const result = await service.getStats()
      expect(result.total).toBe(8)
      expect(result.running).toBe(2)
    })
  })
})
