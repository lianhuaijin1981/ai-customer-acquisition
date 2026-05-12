import { Controller, Post, Body, Get, UseGuards, Request, Ip } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { AuthService } from './auth.service'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'

@ApiTags('认证')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: '登录' })
  async login(
    @Body() body: { username: string; password: string },
    @Ip() ip: string,
  ) {
    return this.authService.login(body.username, body.password, ip)
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取当前用户信息' })
  async me(@Request() req: any) {
    const { passwordHash, ...user } = req.user
    return user
  }
}
