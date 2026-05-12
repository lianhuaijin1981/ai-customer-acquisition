import { Controller, Get } from '@nestjs/common'
import { ApiTags, ApiOperation } from '@nestjs/swagger'

@ApiTags('健康检查')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: '基础健康检查' })
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
    }
  }

  @Get('ready')
  @ApiOperation({ summary: '就绪检查（含依赖项）' })
  async readiness() {
    const checks: Record<string, any> = {}
    let allOk = true

    // 内存检查
    const mem = process.memoryUsage()
    const memLimit = 500 * 1024 * 1024 // 500MB
    checks.memory = {
      status: mem.heapUsed < memLimit ? 'ok' : 'warn',
      heapUsed: `${Math.round(mem.heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(mem.heapTotal / 1024 / 1024)}MB`,
      rss: `${Math.round(mem.rss / 1024 / 1024)}MB`,
    }
    if (mem.heapUsed >= memLimit) allOk = false

    // 检查环境变量
    const requiredEnvs = ['DATABASE_URL']
    const missingEnvs = requiredEnvs.filter(e => !process.env[e])
    checks.env = {
      status: missingEnvs.length === 0 ? 'ok' : 'error',
      missing: missingEnvs.length > 0 ? missingEnvs : undefined,
    }
    if (missingEnvs.length > 0) allOk = false

    return {
      status: allOk ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      checks,
    }
  }

  @Get('live')
  @ApiOperation({ summary: '存活检查' })
  liveness() {
    return { status: 'ok' }
  }
}
