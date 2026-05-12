import { Test } from '@nestjs/testing'
import { NotFoundException } from '@nestjs/common'
import { TemplatesService } from './templates.service'
import { AiService, GenerateTemplateResult } from '../../common/services/ai.service'
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

  const chainMethods = ['select', 'from', 'where', 'and', 'orderBy', 'limit', 'offset', 'update', 'set', 'values']
  for (const method of chainMethods) {
    db[method].mockImplementation(() => db)
  }

  return db
}

describe('TemplatesService', () => {
  let service: TemplatesService
  let db: any
  let aiService: AiService

  const mockAiService = {
    generateTemplate: jest.fn(),
    checkSensitiveWords: jest.fn(),
  }

  beforeEach(async () => {
    jest.clearAllMocks()
    db = createMockDb()

    const module = await Test.createTestingModule({
      providers: [
        TemplatesService,
        { provide: DB_TOKEN, useValue: db },
        { provide: AiService, useValue: mockAiService },
      ],
    }).compile()

    service = module.get(TemplatesService)
    aiService = module.get(AiService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('findAll', () => {
    it('should return paginated templates', async () => {
      const mockTemplates = [
        { id: 'tpl-1', name: 'Template 1', industry: 'tech', status: 'active' },
        { id: 'tpl-2', name: 'Template 2', industry: 'edu', status: 'draft' },
      ]

      db.offset.mockResolvedValueOnce(mockTemplates)

      const result = await service.findAll({ page: 1, pageSize: 20 })
      expect(result.data).toEqual(mockTemplates)
      expect(result.total).toBe(2)
      expect(result.page).toBe(1)
      expect(result.pageSize).toBe(20)
    })

    it('should return empty result for no matching templates', async () => {
      db.offset.mockResolvedValueOnce([])

      const result = await service.findAll({ status: 'archived' })
      expect(result.data).toEqual([])
      expect(result.total).toBe(0)
    })
  })

  describe('findById', () => {
    it('should return a template by id', async () => {
      const mockTemplate = { id: 'tpl-1', name: 'My Template', content: 'Hello {{name}}' }
      db.where.mockResolvedValueOnce([mockTemplate])

      const result = await service.findById('tpl-1')
      expect(result).toEqual(mockTemplate)
    })

    it('should throw NotFoundException for non-existent template', async () => {
      db.where.mockResolvedValueOnce([])

      await expect(service.findById('nonexistent')).rejects.toThrow(NotFoundException)
    })
  })

  describe('create', () => {
    it('should create a template and return it', async () => {
      const created = { id: 'tpl-new', name: 'New Template', content: 'Hello', status: 'active' }
      db.values.mockReturnValue(db)
      db.returning.mockResolvedValueOnce([created])

      const result = await service.create({ name: 'New Template', content: 'Hello', status: 'active' })
      expect(result).toEqual(created)
      expect(db.insert).toHaveBeenCalled()
      expect(db.values).toHaveBeenCalledWith(expect.objectContaining({ name: 'New Template' }))
    })

    it('should include userId as createdBy', async () => {
      db.values.mockReturnValue(db)
      db.returning.mockResolvedValueOnce([{ id: 'tpl-1', name: 'Template', createdBy: 'user-1' }])

      await service.create({ name: 'Template' }, 'user-1')

      const insertValues = db.values.mock.calls[0][0]
      expect(insertValues.createdBy).toBe('user-1')
    })
  })

  describe('update', () => {
    it('should update a template and return it', async () => {
      const updated = { id: 'tpl-1', name: 'Updated', content: 'New content', updatedAt: expect.any(Date) }
      db.set.mockReturnValue(db)
      db.returning.mockResolvedValueOnce([updated])

      const result = await service.update('tpl-1', { name: 'Updated', content: 'New content' })
      expect(result).toEqual(updated)
      expect(db.set).toHaveBeenCalledWith(expect.objectContaining({ name: 'Updated' }))
    })

    it('should throw NotFoundException when updating non-existent template', async () => {
      db.set.mockReturnValue(db)
      db.returning.mockResolvedValueOnce([undefined])

      await expect(service.update('nonexistent', { name: 'X' })).rejects.toThrow(NotFoundException)
    })
  })

  describe('remove', () => {
    it('should delete a template', async () => {
      db.where.mockReturnValue(db)
      const result = await service.remove('tpl-1')
      expect(result.success).toBe(true)
      expect(db.delete).toHaveBeenCalled()
    })
  })

  describe('recordUsage', () => {
    it('should increment useCount on usage with reply', async () => {
      db.where.mockResolvedValueOnce([{ id: 'tpl-1', useCount: 10, replyCount: 3, replyRate: 0.3 }])
      db.set.mockReturnValue(db)

      await service.recordUsage('tpl-1', true)

      expect(db.set).toHaveBeenCalledWith(expect.objectContaining({
        useCount: 11,
        replyCount: 4,
      }))
    })

    it('should not increment replyCount when not replied', async () => {
      db.where.mockResolvedValueOnce([{ id: 'tpl-1', useCount: 10, replyCount: 3, replyRate: 0.3 }])
      db.set.mockReturnValue(db)

      await service.recordUsage('tpl-1', false)

      expect(db.set).toHaveBeenCalledWith(expect.objectContaining({
        useCount: 11,
        replyCount: 3,
      }))
    })

    it('should handle non-existent template gracefully', async () => {
      db.where.mockResolvedValueOnce([])

      await service.recordUsage('nonexistent', true)
      expect(db.set).not.toHaveBeenCalled()
    })

    it('should calculate replyRate correctly', async () => {
      db.where.mockResolvedValueOnce([{ id: 'tpl-1', useCount: 0, replyCount: 0, replyRate: 0 }])
      db.set.mockReturnValue(db)

      await service.recordUsage('tpl-1', true)

      const setCall = db.set.mock.calls[0][0]
      expect(setCall.replyRate).toBe(1)
    })
  })

  describe('aiGenerate', () => {
    const generateParams = {
      industry: 'tech',
      scene: 'first_contact' as const,
      productDesc: 'AI product',
    }

    it('should generate and save template by default', async () => {
      const aiResult: GenerateTemplateResult = {
        content: 'Hello {{name}}, check out our AI product!',
        variables: ['name'],
        passed: true,
        sensitiveWords: [],
      }

      mockAiService.generateTemplate.mockResolvedValue(aiResult)

      db.values.mockReturnValue(db)
      db.returning.mockResolvedValueOnce([{ id: 'tpl-ai', name: 'AI生成', status: 'active' }])

      const result = await service.aiGenerate(generateParams)

      expect(result.saved).toBe(true)
      expect((result as any).templateId).toBe('tpl-ai')
      expect(db.insert).toHaveBeenCalled()
    })

    it('should generate but not save when save=false', async () => {
      mockAiService.generateTemplate.mockResolvedValue({
        content: 'Hello {{name}}!',
        variables: ['name'],
        passed: true,
        sensitiveWords: [],
      })

      const result = await service.aiGenerate({ ...generateParams, save: false })
      expect(result.saved).toBe(false)
      expect(db.insert).not.toHaveBeenCalled()
    })

    it('should not save when content has sensitive words', async () => {
      mockAiService.generateTemplate.mockResolvedValue({
        content: 'Get cheap loans now!',
        variables: [],
        passed: false,
        sensitiveWords: ['贷款'],
      })

      const result = await service.aiGenerate(generateParams)
      expect(result.saved).toBe(false)
      expect(result.message).toContain('敏感词')
      expect(db.insert).not.toHaveBeenCalled()
    })

    it('should pass correct params to AI service', async () => {
      mockAiService.generateTemplate.mockResolvedValue({
        content: 'Hello',
        variables: [],
        passed: true,
        sensitiveWords: [],
      })

      db.values.mockReturnValue(db)
      db.returning.mockResolvedValueOnce([{ id: 'tpl-1' }])

      await service.aiGenerate({
        industry: 'edu',
        scene: 'follow_up',
        productDesc: 'Online courses',
        targetAudience: 'Students',
        tone: 'friendly',
      })

      expect(mockAiService.generateTemplate).toHaveBeenCalledWith({
        industry: 'edu',
        scene: 'follow_up',
        productDesc: 'Online courses',
        targetAudience: 'Students',
        tone: 'friendly',
      })
    })
  })

  describe('checkContent', () => {
    it('should delegate to aiService.checkSensitiveWords', async () => {
      mockAiService.checkSensitiveWords.mockReturnValue({ passed: true, sensitiveWords: [] })

      const result = await service.checkContent('Safe content here')
      expect(result.passed).toBe(true)
      expect(mockAiService.checkSensitiveWords).toHaveBeenCalledWith('Safe content here')
    })

    it('should detect sensitive words', async () => {
      mockAiService.checkSensitiveWords.mockReturnValue({
        passed: false,
        sensitiveWords: ['赌博'],
      })

      const result = await service.checkContent('Come gamble with us')
      expect(result.passed).toBe(false)
      expect(result.sensitiveWords).toEqual(['赌博'])
    })
  })
})
