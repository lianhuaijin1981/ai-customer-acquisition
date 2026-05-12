import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query,
  UseGuards, Request, HttpCode, HttpStatus
} from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { Roles } from '../../common/decorators/roles.decorator'
import { AbTestService } from './abtest.service'

@ApiTags('A/B 话术测试')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('abtest')
export class AbTestController {
  constructor(private readonly abTestService: AbTestService) {}

  @Get()
  @ApiOperation({ summary: '获取 A/B 测试列表' })
  findAll(@Query() query: any) {
    return this.abTestService.findAll({
      page: Number(query.page) || 1,
      pageSize: Number(query.pageSize) || 20,
      status: query.status,
    })
  }

  @Get('stats')
  @ApiOperation({ summary: 'A/B 测试统计' })
  getStats() {
    return this.abTestService.getStats()
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单个 A/B 测试详情' })
  findById(@Param('id') id: string) {
    return this.abTestService.findById(id)
  }

  @Get(':id/analysis')
  @ApiOperation({ summary: '获取 A/B 测试效果分析' })
  getAnalysis(@Param('id') id: string) {
    return this.abTestService.getAnalysis(id)
  }

  @Get(':id/content')
  @ApiOperation({ summary: '根据 userId 分流获取话术内容' })
  getContent(@Param('id') id: string, @Query('userId') userId: string) {
    return this.abTestService.getContent(id, userId)
  }

  @Post()
  @Roles('admin', 'operator')
  @ApiOperation({ summary: '创建 A/B 测试' })
  create(@Body() body: any, @Request() req: any) {
    return this.abTestService.create(body, req.user?.id)
  }

  @Patch(':id')
  @Roles('admin', 'operator')
  @ApiOperation({ summary: '更新 A/B 测试' })
  update(@Param('id') id: string, @Body() body: any) {
    return this.abTestService.update(id, body)
  }

  @Patch(':id/status')
  @Roles('admin', 'operator')
  @ApiOperation({ summary: '更新 A/B 测试状态' })
  updateStatus(@Param('id') id: string, @Body('status') status: any) {
    return this.abTestService.updateStatus(id, status)
  }

  @Delete(':id')
  @Roles('admin', 'operator')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '删除 A/B 测试' })
  delete(@Param('id') id: string) {
    return this.abTestService.delete(id)
  }

  // 效果上报
  @Post(':id/record/send')
  @Roles('admin', 'operator')
  @ApiOperation({ summary: '上报发送事件' })
  recordSend(@Param('id') id: string, @Body('variant') variant: 'A' | 'B') {
    return this.abTestService.recordSend(id, variant)
  }

  @Post(':id/record/reply')
  @Roles('admin', 'operator')
  @ApiOperation({ summary: '上报回复事件' })
  recordReply(@Param('id') id: string, @Body('variant') variant: 'A' | 'B') {
    return this.abTestService.recordReply(id, variant)
  }

  @Post(':id/record/convert')
  @Roles('admin', 'operator')
  @ApiOperation({ summary: '上报转化事件' })
  recordConvert(@Param('id') id: string, @Body('variant') variant: 'A' | 'B') {
    return this.abTestService.recordConvert(id, variant)
  }
}
