import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcryptjs'

// 演示用内存用户，生产环境从数据库查询
const DEMO_USERS = [
  { id: '1', username: 'admin', email: 'admin@company.com', passwordHash: bcrypt.hashSync('123456', 10), role: 'admin' },
  { id: '2', username: 'operator', email: 'op@company.com', passwordHash: bcrypt.hashSync('123456', 10), role: 'operator' },
]

@Injectable()
export class AuthService {
  constructor(private jwt: JwtService) {}

  async login(username: string, password: string) {
    const user = DEMO_USERS.find((u) => u.username === username)
    if (!user) throw new UnauthorizedException('账号不存在')
    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) throw new UnauthorizedException('密码错误')
    const { passwordHash, ...safeUser } = user
    const token = this.jwt.sign({ sub: user.id, username: user.username, role: user.role })
    return { token, user: safeUser }
  }

  async validateUser(payload: any) {
    return DEMO_USERS.find((u) => u.id === payload.sub)
  }
}
