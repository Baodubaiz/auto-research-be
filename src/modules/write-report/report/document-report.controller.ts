import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { ReportService } from './report.service';

@Controller('documents')
@UseGuards(JwtAuthGuard)
export class DocumentReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get(':documentId/report')
  findByDocument(@CurrentUser('sub') userId: string, @Param('documentId') documentId: string) {
    return this.reportService.findByDocument(userId, documentId);
  }
}