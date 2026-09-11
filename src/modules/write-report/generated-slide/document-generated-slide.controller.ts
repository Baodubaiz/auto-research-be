import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { GeneratedSlideService } from './generated-slide.service';

@Controller('documents')
@UseGuards(JwtAuthGuard)
export class DocumentGeneratedSlideController {
  constructor(private readonly service: GeneratedSlideService) {}

  @Get(':documentId/generated-slides')
  findAll(@CurrentUser('sub') userId: string, @Param('documentId') documentId: string) {
    return this.service.findAll(userId, documentId);
  }
}