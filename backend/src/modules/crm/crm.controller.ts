import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'
import { CrmService } from './crm.service'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { Roles } from '../../common/decorators/roles.decorator'

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
  @Roles('admin', 'operator')
  create(@Body() body: any) { return this.service.create(body) }

  @Put('customers/:id')
  @Roles('admin', 'operator')
  update(@Param('id') id: string, @Body() body: any) { return this.service.update(id, body) }

  @Put('customers/:id/tier')
  @Roles('admin', 'operator')
  updateTier(@Param('id') id: string, @Body() body: { tier: string }) { return this.service.update(id, { tier: body.tier }) }
}
