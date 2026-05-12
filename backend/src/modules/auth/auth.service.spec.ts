import { Test } from '@nestjs/testing'
import { JwtService } from '@nestjs/jwt'
import { UnauthorizedException } from '@nestjs/common'
import { AuthService } from './auth.service'

describe('AuthService', () => {
  let service: AuthService
  let jwtService: JwtService

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('test-token'),
          },
        },
      ],
    }).compile()

    service = module.get(AuthService)
    jwtService = module.get(JwtService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('login', () => {
    it('should login with valid credentials', async () => {
      const result = await service.login('admin', '123456')
      expect(result.token).toBe('test-token')
      expect(result.user.username).toBe('admin')
      expect(result.user).not.toHaveProperty('passwordHash')
    })

    it('should throw on invalid username', async () => {
      await expect(service.login('nonexistent', '123456'))
        .rejects.toThrow(UnauthorizedException)
    })

    it('should throw on invalid password', async () => {
      await expect(service.login('admin', 'wrong'))
        .rejects.toThrow(UnauthorizedException)
    })

    it('should lock account after 5 failed attempts', async () => {
      for (let i = 0; i < 5; i++) {
        await service.login('admin', 'wrong').catch(() => {})
      }
      await expect(service.login('admin', '123456'))
        .rejects.toThrow(/锁定/)
    })

    it('should lock by IP after 5 failed attempts', async () => {
      for (let i = 0; i < 5; i++) {
        await service.login('user1', 'wrong', '1.2.3.4').catch(() => {})
      }
      await expect(service.login('admin', '123456', '1.2.3.4'))
        .rejects.toThrow(/IP/)
    })

    it('should clear failed attempts on successful login', async () => {
      await service.login('admin', 'wrong').catch(() => {})
      await service.login('admin', '123456')
      const result = await service.login('admin', '123456')
      expect(result.token).toBe('test-token')
    })
  })

  describe('validateUser', () => {
    it('should return user by id', async () => {
      const user = await service.validateUser({ sub: '1' })
      expect(user).toBeDefined()
      expect(user.username).toBe('admin')
    })

    it('should return undefined for unknown id', async () => {
      const user = await service.validateUser({ sub: '999' })
      expect(user).toBeUndefined()
    })
  })
})
