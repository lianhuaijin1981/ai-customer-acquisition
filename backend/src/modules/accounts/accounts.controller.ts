import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'
import { AccountsService } from './accounts.service'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'

@ApiTags('账号管理')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('accounts')
export class AccountsController {
  constructor(private service: AccountsService) {}

  @Get()
  findAll(@Query() q: any) { return this.service.findAll(q) }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.service.findById(id) }

  @Post()
  create(@Body() body: any) { return this.service.create(body) }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: any) { return this.service.update(id, body) }

  @Put(':id/toggle')
  toggle(@Param('id') id: string) { return this.service.toggleAccount(id) }

  @Put(':id/refresh-cookie')
  refreshCookie(@Param('id') id: string, @Body() body: { cookie: string }) {
    return this.service.update(id, { loginCookie: body.cookie })
  }

  @Delete(':id')
  remove(@Param('id') id: string) { return this.service.remove(id) }
}
