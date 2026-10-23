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
import { DataAnalysisAiService } from './data-analysis-ai.service';
import { CheckLogicDataDto, CommentDataDto } from './dto/data-analysis.dto';

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
  constructor(private readonly aiService: DataAnalysisAiService) {}

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
