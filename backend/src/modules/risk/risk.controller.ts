import { Controller, Get, Post, Put, Param, Body, Query, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'
import { RiskService } from './risk.service'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'

@ApiTags('风控管理')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('risk')
export class RiskController {
  constructor(private service: RiskService) {}

  @Get('events')
  getEvents(@Query() q: any) { return this.service.getEvents(q) }

  @Put('events/:id/resolve')
  resolveEvent(@Param('id') id: string) { return this.service.resolveEvent(id) }

  @Get('rules')
  getRules() { return this.service.getRules() }

  @Put('rules/:id')
  updateRule(@Param('id') id: string, @Body() body: any) { return this.service.updateRule(id, body) }

  @Get('stats')
  getStats() { return this.service.getStats() }
}
