import { Controller, Get, Post, Put, Param, Body, Query, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger'
import { LeadsService } from './leads.service'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { Roles } from '../../common/decorators/roles.decorator'

@ApiTags('线索管理')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('leads')
export class LeadsController {
  constructor(private leadsService: LeadsService) {}

  @Get()
  @ApiOperation({ summary: '获取线索列表' })
  @ApiQuery({ name: 'platform', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'intentLevel', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  findAll(@Query() query: any) {
    return this.leadsService.findAll({
      ...query,
      page: Number(query.page ?? 1),
      pageSize: Number(query.pageSize ?? 20),
    })
  }

  @Get('stats')
  @ApiOperation({ summary: '获取线索统计' })
  getStats() {
    return this.leadsService.getStats()
  }

  @Get(':id')
  @ApiOperation({ summary: '获取线索详情' })
  findOne(@Param('id') id: string) {
    return this.leadsService.findById(id)
  }

  @Post()
  @Roles('admin', 'operator')
  @ApiOperation({ summary: '手动创建线索' })
  create(@Body() body: any) {
    return this.leadsService.create(body)
  }

  @Put(':id')
  @Roles('admin', 'operator')
  @ApiOperation({ summary: '更新线索信息' })
  update(@Param('id') id: string, @Body() body: any) {
    return this.leadsService.update(id, body)
  }

  @Put(':id/status')
  @Roles('admin', 'operator')
  @ApiOperation({ summary: '更新线索状态' })
  updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.leadsService.updateStatus(id, body.status)
  }
}
