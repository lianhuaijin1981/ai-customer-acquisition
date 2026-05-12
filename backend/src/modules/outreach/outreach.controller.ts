import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'
import { OutreachService } from './outreach.service'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { Roles } from '../../common/decorators/roles.decorator'

@ApiTags('触达运营')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('outreach')
export class OutreachController {
  constructor(private service: OutreachService) {}

  @Get('tasks')
  findAll(@Query() query: any) { return this.service.findAll(query) }

  @Get('tasks/:id')
  findOne(@Param('id') id: string) { return this.service.findById(id) }

  @Post('tasks')
  @Roles('admin', 'operator')
  create(@Body() body: any) { return this.service.create(body) }

  @Put('tasks/:id')
  @Roles('admin', 'operator')
  update(@Param('id') id: string, @Body() body: any) { return this.service.update(id, body) }

  @Put('tasks/:id/toggle')
  @Roles('admin', 'operator')
  toggle(@Param('id') id: string) { return this.service.toggleTask(id) }

  @Delete('tasks/:id')
  @Roles('admin')
  remove(@Param('id') id: string) { return this.service.remove(id) }
}
