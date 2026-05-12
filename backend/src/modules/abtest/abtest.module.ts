import { Module } from '@nestjs/common'
import { AbTestController } from './abtest.controller'
import { AbTestService } from './abtest.service'
import { DatabaseModule } from '../../database/database.module'

@Module({
  imports: [DatabaseModule],
  controllers: [AbTestController],
  providers: [AbTestService],
  exports: [AbTestService],
})
export class AbTestModule {}
