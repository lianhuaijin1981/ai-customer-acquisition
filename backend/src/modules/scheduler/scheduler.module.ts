import { Module } from '@nestjs/common'
import { SchedulerService } from './scheduler.service'
import { RiskModule } from '../risk/risk.module'

@Module({
  imports: [RiskModule],
  providers: [SchedulerService],
  exports: [SchedulerService],
})
export class SchedulerModule {}
