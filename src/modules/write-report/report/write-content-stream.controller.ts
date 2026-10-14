import {
  Body,
  Controller,
  MessageEvent,
  Param,
  Post,
  Sse,
  UseGuards,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { WriteContentRequestDto } from './dto/write-content-request.dto';
import { WriteContentAiService } from './write-content-ai.service';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class WriteContentStreamController {
  constructor(private readonly writeContentAiService: WriteContentAiService) {}

  @Post([':documentId/write-content', 'write-content'])
  startWriteContent(
    @CurrentUser('sub') userId: string,
    @Param('documentId') paramDocId: string | undefined,
    @Body() dto: WriteContentRequestDto,
  ) {
    if (paramDocId) {
      dto.documentId = paramDocId;
    }
    return this.writeContentAiService.startWriteContent(userId, dto);
  }

  @Sse(':documentId/write-stream')
  streamWriteContent(
    @CurrentUser('sub') userId: string,
    @Param('documentId') documentId: string,
  ): Promise<Observable<MessageEvent>> {
    return this.writeContentAiService.getWriteStream(userId, documentId);
  }
}
