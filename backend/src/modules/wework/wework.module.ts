import { Module } from '@nestjs/common'
import { WeworkController } from './wework.controller'
import { WeworkService } from './wework.service'
import { DatabaseModule } from '../../database/database.module'

@Module({
  imports: [DatabaseModule],
  controllers: [WeworkController],
  providers: [WeworkService],
  exports: [WeworkService],
})
export class WeworkModule {}
