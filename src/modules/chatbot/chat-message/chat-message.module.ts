import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth/auth.module';
import { ChatMessageRouteController } from './chat-message-route.controller';
import { ChatMessageController } from './chat-message.controller';
import { ChatMessageService } from './chat-message.service';

@Module({ imports: [AuthModule], controllers: [ChatMessageController, ChatMessageRouteController], providers: [ChatMessageService], exports: [ChatMessageService] })
export class ChatMessageModule {}