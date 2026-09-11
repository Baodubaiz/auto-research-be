import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth/auth.module';
import { ChatSessionController } from './chat-session.controller';
import { ChatSessionRouteController } from './chat-session-route.controller';
import { ChatSessionService } from './chat-session.service';

@Module({ imports: [AuthModule], controllers: [ChatSessionController, ChatSessionRouteController], providers: [ChatSessionService], exports: [ChatSessionService] })
export class ChatSessionModule {}