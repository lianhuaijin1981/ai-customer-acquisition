import { Injectable, UnauthorizedException, Logger } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcryptjs'

// 演示用内存用户，生产环境从数据库查询
const DEMO_USERS = [
  { id: '1', username: 'admin', email: 'admin@company.com', passwordHash: bcrypt.hashSync('123456', 10), role: 'admin' },
  { id: '2', username: 'operator', email: 'op@company.com', passwordHash: bcrypt.hashSync('123456', 10), role: 'operator' },
]

interface LoginAttempt {
  count: number
  lockedUntil: number | null
  lastAttempt: number
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name)

  // 登录失败记录：key 为 username 或 IP
  private loginAttempts = new Map<string, LoginAttempt>()

  // 配置
  private readonly MAX_ATTEMPTS = 5
  private readonly LOCK_DURATION = 15 * 60 * 1000 // 15 分钟
  private readonly ATTEMPT_WINDOW = 30 * 60 * 1000 // 30 分钟窗口

  constructor(private jwt: JwtService) {}

  async login(username: string, password: string, clientIp?: string) {
    // 检查账号锁定
    const lockKey = username
    const ipKey = `ip:${clientIp || 'unknown'}`
    const now = Date.now()

    // 检查账号维度的锁定
    const accountAttempt = this.loginAttempts.get(lockKey)
    if (accountAttempt?.lockedUntil && accountAttempt.lockedUntil > now) {
      const remainingMin = Math.ceil((accountAttempt.lockedUntil - now) / 60000)
      throw new UnauthorizedException(
        `账号已被锁定，请 ${remainingMin} 分钟后再试`
      )
    }

    // 检查 IP 维度的锁定
    const ipAttempt = this.loginAttempts.get(ipKey)
    if (ipAttempt?.lockedUntil && ipAttempt.lockedUntil > now) {
      const remainingMin = Math.ceil((ipAttempt.lockedUntil - now) / 60000)
      throw new UnauthorizedException(
        `该 IP 登录尝试过多，请 ${remainingMin} 分钟后再试`
      )
    }

    // 验证凭据
    const user = DEMO_USERS.find((u) => u.username === username)
    if (!user) {
      this.recordFailedAttempt(lockKey, ipKey, now)
      throw new UnauthorizedException('账号不存在')
    }

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      this.recordFailedAttempt(lockKey, ipKey, now)
      throw new UnauthorizedException('密码错误')
    }

    // 登录成功：清除失败记录
    this.loginAttempts.delete(lockKey)
    this.loginAttempts.delete(ipKey)

    const { passwordHash, ...safeUser } = user
    const token = this.jwt.sign({ sub: user.id, username: user.username, role: user.role })
    return { token, user: safeUser }
  }

  async validateUser(payload: any) {
    return DEMO_USERS.find((u) => u.id === payload.sub)
  }

  private recordFailedAttempt(lockKey: string, ipKey: string, now: number) {
    // 更新账号维度
    this.updateAttempt(lockKey, now)
    // 更新 IP 维度
    this.updateAttempt(ipKey, now)
  }

  private updateAttempt(key: string, now: number) {
    const existing = this.loginAttempts.get(key)

    // 窗口过期则重置
    if (existing && now - existing.lastAttempt > this.ATTEMPT_WINDOW) {
      this.loginAttempts.set(key, { count: 1, lockedUntil: null, lastAttempt: now })
      return
    }

    const count = (existing?.count || 0) + 1

    if (count >= this.MAX_ATTEMPTS) {
      const lockedUntil = now + this.LOCK_DURATION
      this.loginAttempts.set(key, { count, lockedUntil, lastAttempt: now })
      this.logger.warn(`登录锁定触发: ${key}，锁定至 ${new Date(lockedUntil).toISOString()}`)
    } else {
      this.loginAttempts.set(key, { count, lockedUntil: existing?.lockedUntil || null, lastAttempt: now })
    }
  }
}
