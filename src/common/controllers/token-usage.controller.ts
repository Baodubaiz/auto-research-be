import { Controller, Get, Param } from '@nestjs/common';
import { TokenUsageService } from '../services/token-usage.service';
import {
  UserTokenUsageSummary,
  DocumentTokenUsageSummary,
} from '../dto/record-token-usage.dto';

@Controller('token-usage')
export class TokenUsageController {
  constructor(private readonly tokenUsageService: TokenUsageService) {}

  @Get('user/:userId')
  async getUserSummary(
    @Param('userId') userId: string,
  ): Promise<UserTokenUsageSummary> {
    return this.tokenUsageService.getUserSummary(userId);
  }

  @Get('document/:documentId')
  async getDocumentSummary(
    @Param('documentId') documentId: string,
  ): Promise<DocumentTokenUsageSummary> {
    return this.tokenUsageService.getDocumentSummary(documentId);
  }
}
