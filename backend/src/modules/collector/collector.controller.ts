import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { CollectorService, CollectTaskConfig } from './collector.service'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { Roles } from '../../common/decorators/roles.decorator'

@ApiTags('数据采集')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('collector')
export class CollectorController {
  constructor(private collectorService: CollectorService) {}

  @Post('run')
  @Roles('admin', 'operator')
  @ApiOperation({ summary: '手动触发采集任务' })
  async runCollect(@Body() body: CollectTaskConfig) {
    const results = await this.collectorService.runCollectTask(body)
    return {
      success: true,
      message: `采集完成`,
      results,
      summary: {
        totalCollected: results.reduce((s, r) => s + r.collected, 0),
        totalSaved: results.reduce((s, r) => s + r.saved, 0),
        totalDuplicates: results.reduce((s, r) => s + r.duplicates, 0),
      },
    }
  }

  @Get('status')
  @ApiOperation({ summary: '获取采集引擎状态' })
  getStatus() {
    return this.collectorService.getStatus()
  }
}
