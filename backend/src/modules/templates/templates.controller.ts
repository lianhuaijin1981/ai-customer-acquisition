import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'
import { TemplatesService } from './templates.service'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { Roles } from '../../common/decorators/roles.decorator'

@ApiTags('话术模板')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('templates')
export class TemplatesController {
  constructor(private service: TemplatesService) {}

  @Get()
  findAll(@Query() q: any) { return this.service.findAll(q) }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.service.findById(id) }

  @Post()
  @Roles('admin', 'operator')
  create(@Body() body: any) { return this.service.create(body) }

  @Post('ai-generate')
  @Roles('admin', 'operator')
  aiGenerate(@Body() body: any) { return this.service.aiGenerate(body) }

  @Put(':id')
  @Roles('admin', 'operator')
  update(@Param('id') id: string, @Body() body: any) { return this.service.update(id, body) }

  @Delete(':id')
  @Roles('admin', 'operator')
  remove(@Param('id') id: string) { return this.service.remove(id) }
}
