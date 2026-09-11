import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { ProposedMethodService } from './proposed-method.service';

@Controller('documents')
@UseGuards(JwtAuthGuard)
export class DocumentProposedMethodController {
  constructor(private readonly service: ProposedMethodService) {}

  @Get(':documentId/proposed-methods')
  findAll(@CurrentUser('sub') userId: string, @Param('documentId') documentId: string) {
    return this.service.findAll(userId, documentId);
  }
}