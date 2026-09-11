import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { EnhancementSessionService } from './enhancement-session.service';

@Controller('documents')
@UseGuards(JwtAuthGuard)
export class DocumentEnhancementSessionController {
  constructor(private readonly service: EnhancementSessionService) {}

  @Get(':documentId/enhancement-sessions')
  findAll(@CurrentUser('sub') userId: string, @Param('documentId') documentId: string) {
    return this.service.findAll(userId, documentId);
  }
}