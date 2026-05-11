import { Module } from '@nestjs/common'
import { CollectorController } from './collector.controller'
import { CollectorService } from './collector.service'
import { WeiboCollector } from './weibo.collector'
import { XiaohongshuCollector } from './xiaohongshu.collector'

@Module({
  controllers: [CollectorController],
  providers: [CollectorService, WeiboCollector, XiaohongshuCollector],
  exports: [CollectorService],
})
export class CollectorModule {}
