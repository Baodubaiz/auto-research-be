import { Module } from '@nestjs/common';
import { ChatMessageModule } from './chat-message/chat-message.module';
import { ChatSessionModule } from './chat-session/chat-session.module';

@Module({ imports: [ChatSessionModule, ChatMessageModule] })
export class ChatbotModule {}