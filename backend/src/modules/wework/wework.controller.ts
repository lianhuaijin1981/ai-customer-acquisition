import {
  Controller, Get, Post, Delete, Body, Param, Query,
  UseGuards, Request, HttpCode, HttpStatus
} from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { WeworkService } from './wework.service'

@ApiTags('企业微信 SCRM')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('wework')
export class WeworkController {
  constructor(private readonly weworkService: WeworkService) {}

  // -------- 配置 --------

  @Get('configs')
  @ApiOperation({ summary: '获取企微配置列表' })
  getConfigs() {
    return this.weworkService.getConfigs()
  }

  @Post('configs')
  @ApiOperation({ summary: '新增企微配置' })
  createConfig(@Body() body: any, @Request() req: any) {
    return this.weworkService.createConfig(body, req.user?.id)
  }

  @Delete('configs/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '删除企微配置' })
  deleteConfig(@Param('id') id: string) {
    return this.weworkService.deleteConfig(id)
  }

  @Post('configs/:id/test')
  @ApiOperation({ summary: '测试企微连接' })
  testConnection(@Param('id') id: string) {
    return this.weworkService.testConnection(id)
  }

  // -------- 好友添加 --------

  @Post('friend/add')
  @ApiOperation({ summary: '添加企微好友' })
  addFriend(@Body() body: any) {
    return this.weworkService.addFriend(body)
  }

  @Get('friend/requests')
  @ApiOperation({ summary: '好友申请记录列表' })
  getFriendRequests(@Query() query: any) {
    return this.weworkService.getFriendRequests({
      page: Number(query.page) || 1,
      pageSize: Number(query.pageSize) || 20,
      status: query.status,
      configId: query.configId,
    })
  }

  // -------- 私信发送 --------

  @Post('message/send')
  @ApiOperation({ summary: '发送单条私信' })
  sendMessage(@Body() body: any) {
    return this.weworkService.sendMessage(body)
  }

  @Post('message/batch-send')
  @ApiOperation({ summary: '批量发送私信' })
  batchSend(@Body() body: any) {
    return this.weworkService.batchSendMessages(body)
  }

  @Get('messages')
  @ApiOperation({ summary: '私信记录列表' })
  getMessages(@Query() query: any) {
    return this.weworkService.getMessages({
      page: Number(query.page) || 1,
      pageSize: Number(query.pageSize) || 20,
      status: query.status,
      configId: query.configId,
    })
  }

  // -------- 统计 --------

  @Get('stats')
  @ApiOperation({ summary: '企微 SCRM 数据统计' })
  getStats() {
    return this.weworkService.getStats()
  }
}
