import { Controller, Get, Query, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { DashboardService } from './dashboard.service'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'

@ApiTags('数据看板')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private service: DashboardService) {}

  @Get('stats')
  @ApiOperation({ summary: '获取看板核心指标' })
  getStats() { return this.service.getStats() }

  @Get('trend')
  @ApiOperation({ summary: '获取趋势数据' })
  getTrend(@Query('days') days?: string) {
    return this.service.getTrend(Number(days ?? 7))
  }

  @Get('funnel')
  @ApiOperation({ summary: '获取漏斗数据' })
  getFunnel() { return this.service.getFunnel() }

  @Get('platform-distribution')
  @ApiOperation({ summary: '获取平台线索分布' })
  getPlatformDistribution() { return this.service.getPlatformDistribution() }

  @Get('alerts')
  @ApiOperation({ summary: '获取实时风控预警' })
  getAlerts() { return this.service.getAlerts() }
}
