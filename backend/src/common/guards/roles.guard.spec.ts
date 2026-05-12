import { RolesGuard } from './roles.guard'
import { Reflector } from '@nestjs/core'
import { ForbiddenException } from '@nestjs/common'

describe('RolesGuard', () => {
  let guard: RolesGuard
  let reflector: Reflector

  beforeEach(() => {
    reflector = new Reflector()
    guard = new RolesGuard(reflector)
  })

  const mockExecutionContext = (user: any = null) => ({
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
    getHandler: () => jest.fn(),
    getClass: () => jest.fn(),
  })

  it('should allow access when no roles required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined)
    const ctx = mockExecutionContext() as any
    expect(guard.canActivate(ctx)).toBe(true)
  })

  it('should allow admin to access any endpoint', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['operator'])
    const ctx = mockExecutionContext({ role: 'admin' }) as any
    expect(guard.canActivate(ctx)).toBe(true)
  })

  it('should allow user with matching role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin', 'operator'])
    const ctx = mockExecutionContext({ role: 'operator' }) as any
    expect(guard.canActivate(ctx)).toBe(true)
  })

  it('should deny user without required role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin'])
    const ctx = mockExecutionContext({ role: 'operator' }) as any
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException)
  })

  it('should deny unauthenticated user for protected endpoint', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin'])
    const ctx = mockExecutionContext(null) as any
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException)
  })
})
