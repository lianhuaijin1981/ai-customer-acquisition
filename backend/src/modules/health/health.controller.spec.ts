import { Test } from '@nestjs/testing'
import { HealthController } from './health.controller'

describe('HealthController', () => {
  let controller: HealthController

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile()

    controller = module.get(HealthController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('check', () => {
    it('should return ok status', () => {
      const result = controller.check()
      expect(result.status).toBe('ok')
      expect(result).toHaveProperty('timestamp')
      expect(result).toHaveProperty('uptime')
    })
  })

  describe('readiness', () => {
    it('should return ok status with checks', async () => {
      const result = await controller.readiness()
      expect(result).toHaveProperty('status')
      expect(result).toHaveProperty('checks')
      expect(result.checks).toHaveProperty('memory')
      expect(result.checks).toHaveProperty('env')
    })
  })

  describe('liveness', () => {
    it('should return ok status', () => {
      const result = controller.liveness()
      expect(result.status).toBe('ok')
    })
  })
})
