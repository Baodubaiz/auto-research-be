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
import {
  ResumeWriterAgentDto,
  StartWriterAgentDto,
  WriterChatbotDto,
} from './dto/writer-chatbot.dto';
import { WriterInteractiveAiService } from './writer-interactive-ai.service';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class WriterAgentStreamController {
  constructor(private readonly writerService: WriterInteractiveAiService) {}

  @Post([
    'sessions/:sessionId/writer-chatbot',
    '/chat-sessions/:sessionId/writer-chatbot',
  ])
  interactWriterChatbot(
    @CurrentUser('sub') userId: string,
    @Param('sessionId') sessionId: string,
    @Body() dto: WriterChatbotDto,
  ) {
    return this.writerService.interactWriterChatbot(userId, sessionId, dto);
  }

  @Post([
    'sessions/:sessionId/writer/start',
    '/chat-sessions/:sessionId/writer/start',
  ])
  startWriterAgent(
    @CurrentUser('sub') userId: string,
    @Param('sessionId') sessionId: string,
    @Body() dto: StartWriterAgentDto,
  ) {
    return this.writerService.startWriterAgent(userId, sessionId, dto);
  }

  @Sse('sessions/:sessionId/writer/stream')
  streamWriter(
    @CurrentUser('sub') userId: string,
    @Param('sessionId') sessionId: string,
  ): Observable<MessageEvent> {
    return this.writerService.getWriterStream(userId, sessionId);
  }

  @Post([
    'sessions/:sessionId/writer/resume',
    '/chat-sessions/:sessionId/writer/resume',
  ])
  resumeWriterAgent(
    @CurrentUser('sub') userId: string,
    @Param('sessionId') sessionId: string,
    @Body() dto: ResumeWriterAgentDto,
  ) {
    return this.writerService.resumeWriterAgent(userId, sessionId, dto);
  }
}
