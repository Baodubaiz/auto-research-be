import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth/auth.module';
import { EnhancementSessionController } from './enhancement-session.controller';
import { EnhancementSessionRouteController } from './enhancement-session-route.controller';
import { DocumentEnhancementSessionController } from './document-enhancement-session.controller';
import { EnhancementSessionService } from './enhancement-session.service';

@Module({
  imports: [AuthModule],
  controllers: [EnhancementSessionController, EnhancementSessionRouteController, DocumentEnhancementSessionController],
  providers: [EnhancementSessionService],
  exports: [EnhancementSessionService],
})
export class EnhancementSessionModule {}