import { Module } from '@nestjs/common'
import { HealthController } from './health.controller'
import { MetricsController } from './metrics.controller'
import { MetricsService } from '../../common/services/metrics.service'

@Module({
  controllers: [HealthController, MetricsController],
  providers: [MetricsService],
  exports: [MetricsService],
})
export class HealthModule {}
