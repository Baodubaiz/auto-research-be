import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { TranslateReportDto } from './dto/translate-report.dto';
import { ReportService } from './report.service';
import { TranslateAiService } from './translate-ai.service';

@Controller('documents')
@UseGuards(JwtAuthGuard)
export class DocumentReportController {
  constructor(
    private readonly reportService: ReportService,
    private readonly translateAiService: TranslateAiService,
  ) {}

  @Get(':documentId/report')
  findByDocument(
    @CurrentUser('sub') userId: string,
    @Param('documentId') documentId: string,
  ) {
    return this.reportService.findByDocument(userId, documentId);
  }

  /**
   * Event `translate_report` — AI dịch và ghi vào Mongo, BE đọc lại
   * `translatedContent` / `translatedOutline` rồi trả FE.
   */
  @Post(':documentId/translate-report')
  @HttpCode(HttpStatus.OK)
  translate(
    @CurrentUser('sub') userId: string,
    @Param('documentId', ParseUUIDPipe) documentId: string,
    @Body() dto: TranslateReportDto,
  ) {
    return this.translateAiService.translate(userId, documentId, dto);
  }
}
