import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth/auth.module';
import { ChatMessageRouteController } from './chat-message-route.controller';
import { ChatMessageController } from './chat-message.controller';
import { WriterAgentStreamController } from './writer-agent-stream.controller';
import { ChatMessageService } from './chat-message.service';
import { ChatbotAiService } from './chatbot-ai.service';
import { ChatbotAiDispatcher } from './chatbot-ai.dispatcher';
import { WriterInteractiveAiService } from './writer-interactive-ai.service';
import { WriterChatbotService } from './writer-chatbot.service';
import { WriterAgentService } from './writer-agent.service';

@Module({
  imports: [AuthModule],
  controllers: [
    ChatMessageController,
    ChatMessageRouteController,
    WriterAgentStreamController,
  ],
  providers: [
    ChatMessageService,
    ChatbotAiService,
    ChatbotAiDispatcher,
    WriterChatbotService,
    WriterAgentService,
    WriterInteractiveAiService,
  ],
  exports: [
    ChatMessageService,
    ChatbotAiService,
    WriterChatbotService,
    WriterAgentService,
    WriterInteractiveAiService,
  ],
})
export class ChatMessageModule {}
