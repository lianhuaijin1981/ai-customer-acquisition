import { Controller, Get, Res } from '@nestjs/common'
import { ApiExcludeEndpoint } from '@nestjs/swagger'
import { MetricsService } from '../../common/services/metrics.service'
import { Response } from 'express'

@Controller('metrics')
export class MetricsController {
  constructor(private metricsService: MetricsService) {}

  @Get()
  @ApiExcludeEndpoint()
  async getMetrics(@Res() res: Response) {
    const metrics = await this.metricsService.getMetrics()
    res.set('Content-Type', this.metricsService.getContentType())
    res.end(metrics)
  }
}
