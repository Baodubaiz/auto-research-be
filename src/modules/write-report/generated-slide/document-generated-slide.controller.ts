import {
  Body,
  Controller,
  Get,
  MessageEvent,
  Param,
  Post,
  Sse,
  UseGuards,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { GenerateSlideRequestDto } from './dto/generate-slide-request.dto';
import { GeneratedSlideService } from './generated-slide.service';
import { GeneratedSlideAiService } from './generated-slide-ai.service';

@Controller('documents')
@UseGuards(JwtAuthGuard)
export class DocumentGeneratedSlideController {
  constructor(
    private readonly service: GeneratedSlideService,
    private readonly aiService: GeneratedSlideAiService,
  ) {}

  @Get(':documentId/generated-slides')
  findAll(
    @CurrentUser('sub') userId: string,
    @Param('documentId') documentId: string,
  ) {
    return this.service.findAll(userId, documentId);
  }

  @Post(':documentId/slides/generate')
  generate(
    @CurrentUser('sub') userId: string,
    @Param('documentId') documentId: string,
    @Body() dto: GenerateSlideRequestDto,
  ) {
    dto.documentId = documentId;
    return this.aiService.generateSlides(userId, dto);
  }

  @Get(':documentId/slides/status')
  getStatus(
    @CurrentUser('sub') userId: string,
    @Param('documentId') documentId: string,
  ) {
    return this.aiService.getSlideStatus(userId, documentId);
  }

  @Sse(':documentId/slides/stream')
  stream(
    @CurrentUser('sub') userId: string,
    @Param('documentId') documentId: string,
  ): Promise<Observable<MessageEvent>> {
    return this.aiService.getSlideStream(userId, documentId);
  }
}
