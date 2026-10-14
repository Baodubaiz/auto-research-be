import { Injectable } from '@nestjs/common';
import { WriterChatbotService } from './writer-chatbot.service';
import { WriterAgentService } from './writer-agent.service';
import {
  ResumeWriterAgentDto,
  StartWriterAgentDto,
  WriterChatbotDto,
} from './dto/writer-chatbot.dto';

@Injectable()
export class WriterInteractiveAiService {
  constructor(
    private readonly chatbotService: WriterChatbotService,
    private readonly agentService: WriterAgentService,
  ) {}

  interactWriterChatbot(
    userId: string,
    sessionId: string,
    dto: WriterChatbotDto,
  ) {
    return this.chatbotService.interactWriterChatbot(userId, sessionId, dto);
  }

  startWriterAgent(
    userId: string,
    sessionId: string,
    dto: StartWriterAgentDto,
  ) {
    return this.agentService.startWriterAgent(userId, sessionId, dto);
  }

  getWriterStream(userId: string, sessionId: string) {
    return this.agentService.getWriterStream(userId, sessionId);
  }

  resumeWriterAgent(
    userId: string,
    sessionId: string,
    dto: ResumeWriterAgentDto,
  ) {
    return this.agentService.resumeWriterAgent(userId, sessionId, dto);
  }
}
