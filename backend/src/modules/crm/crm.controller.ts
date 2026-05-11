import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'
import { CrmService } from './crm.service'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'

@ApiTags('私域承接 CRM')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('crm')
export class CrmController {
  constructor(private service: CrmService) {}

  @Get('customers')
  findAll(@Query() q: any) { return this.service.findAll(q) }

  @Get('customers/:id')
  findOne(@Param('id') id: string) { return this.service.findById(id) }

  @Post('customers')
  create(@Body() body: any) { return this.service.create(body) }

  @Put('customers/:id')
  update(@Param('id') id: string, @Body() body: any) { return this.service.update(id, body) }

  @Put('customers/:id/tier')
  updateTier(@Param('id') id: string, @Body() body: { tier: string }) { return this.service.update(id, { tier: body.tier }) }
}
