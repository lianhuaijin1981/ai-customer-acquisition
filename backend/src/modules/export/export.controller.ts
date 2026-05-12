import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger'
import { Response } from 'express'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { ExportService } from './export.service'

@ApiTags('数据导出')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('export')
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Get()
  @ApiOperation({ summary: '导出数据（支持线索/任务/日志/客户/运营数据/模板）' })
  @ApiQuery({ name: 'type', enum: ['leads', 'outreach_tasks', 'outreach_logs', 'customers', 'analytics', 'templates'] })
  @ApiQuery({ name: 'format', enum: ['excel', 'csv'], required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'platform', required: false })
  @ApiQuery({ name: 'status', required: false })
  async export(@Query() query: any, @Res() res: Response) {
    await this.exportService.export(res, {
      type: query.type || 'leads',
      format: query.format || 'excel',
      startDate: query.startDate,
      endDate: query.endDate,
      platform: query.platform,
      status: query.status,
    })
  }
}
