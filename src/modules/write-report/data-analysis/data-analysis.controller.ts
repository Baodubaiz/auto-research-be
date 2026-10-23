import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { AnalyzeAiService } from './analyze-ai.service';
import { DataAnalysisAiService } from './data-analysis-ai.service';
import {
  AnalyzeRequestDto,
  CheckLogicDataDto,
  CommentDataDto,
} from './dto/data-analysis.dto';

/**
 * Service 2 — 2 event không phụ thuộc AI fix:
 * - `comment_data` (mã lỗi 636)
 * - `check_logic_data` (mã lỗi 642)
 *
 * Dataset thuộc user khác ⇒ 404 (không lộ sự tồn tại tài nguyên).
 */
@Controller('datasets')
@UseGuards(JwtAuthGuard)
export class DataAnalysisController {
  constructor(
    private readonly aiService: DataAnalysisAiService,
    private readonly analyzeService: AnalyzeAiService,
  ) {}

  /** Event `analyzer` — báo cáo phân tích chuyên sâu (mã lỗi 631). */
  @Post(':datasetId/analyze')
  @HttpCode(HttpStatus.OK)
  analyze(
    @CurrentUser('sub') userId: string,
    @Param('datasetId', ParseUUIDPipe) datasetId: string,
    @Body() dto: AnalyzeRequestDto,
  ) {
    return this.analyzeService.analyze(userId, datasetId, dto);
  }

  /** Event `analyzer_tool` — chạy nhanh, không chèn bảng/biểu đồ vào báo cáo. */
  @Post(':datasetId/analyze-tool')
  @HttpCode(HttpStatus.OK)
  analyzeTool(
    @CurrentUser('sub') userId: string,
    @Param('datasetId', ParseUUIDPipe) datasetId: string,
    @Body() dto: AnalyzeRequestDto,
  ) {
    return this.analyzeService.analyzeTool(userId, datasetId, dto);
  }

  @Post(':datasetId/comment')
  @HttpCode(HttpStatus.OK)
  commentData(
    @CurrentUser('sub') userId: string,
    @Param('datasetId', ParseUUIDPipe) datasetId: string,
    @Body() dto: CommentDataDto,
  ) {
    return this.aiService.commentData(userId, datasetId, dto);
  }

  @Post(':datasetId/check-logic')
  @HttpCode(HttpStatus.OK)
  checkLogicData(
    @CurrentUser('sub') userId: string,
    @Param('datasetId', ParseUUIDPipe) datasetId: string,
    @Body() dto: CheckLogicDataDto,
  ) {
    return this.aiService.checkLogicData(userId, datasetId, dto);
  }
}
