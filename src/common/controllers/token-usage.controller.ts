import {
  Controller,
  ForbiddenException,
  Get,
  Param,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../decorators/current-user.decorator';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { TokenUsageService } from '../services/token-usage.service';
import {
  UserTokenUsageSummary,
  DocumentTokenUsageSummary,
} from '../dto/record-token-usage.dto';

@Controller('token-usage')
@UseGuards(JwtAuthGuard)
export class TokenUsageController {
  constructor(private readonly tokenUsageService: TokenUsageService) {}

  @Get('user/:userId')
  async getUserSummary(
    @CurrentUser('sub') currentUserId: string,
    @Param('userId') userId: string,
  ): Promise<UserTokenUsageSummary> {
    if (currentUserId && currentUserId !== userId) {
      throw new ForbiddenException(
        'You are not authorized to view token usage of another user',
      );
    }
    return this.tokenUsageService.getUserSummary(userId);
  }

  @Get('document/:documentId')
  async getDocumentSummary(
    @Param('documentId') documentId: string,
  ): Promise<DocumentTokenUsageSummary> {
    return this.tokenUsageService.getDocumentSummary(documentId);
  }
}
