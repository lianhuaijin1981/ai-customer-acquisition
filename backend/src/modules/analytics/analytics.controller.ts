import { Controller, Get, Query, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'
import { AnalyticsService } from './analytics.service'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'

@ApiTags('数据分析')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private service: AnalyticsService) {}

  @Get('overview')
  getOverview(@Query() q: any) { return this.service.getOverview(q) }

  @Get('platform-comparison')
  getPlatformComparison(@Query() q: any) { return this.service.getPlatformComparison(q) }

  @Get('ai-suggestions')
  getAiSuggestions() { return this.service.getAiSuggestions() }
}
