import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { ReportService } from './report.service';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Post()
  create(@CurrentUser('sub') userId: string, @Body() dto: CreateReportDto) { return this.reportService.create(userId, dto); }

  @Get()
  findAll(@CurrentUser('sub') userId: string) { return this.reportService.findAll(userId); }

  @Get(':id')
  findOne(@CurrentUser('sub') userId: string, @Param('id') id: string) { return this.reportService.findOne(userId, id); }

  @Patch(':id')
  update(@CurrentUser('sub') userId: string, @Param('id') id: string, @Body() dto: UpdateReportDto) { return this.reportService.update(userId, id, dto); }

  @Delete(':id')
  remove(@CurrentUser('sub') userId: string, @Param('id') id: string) { return this.reportService.remove(userId, id); }
}