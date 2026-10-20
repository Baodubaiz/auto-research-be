import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth/auth.module';
import { EnhancementAiController } from './enhancement-ai.controller';
import { EnhancementAiService } from './enhancement-ai.service';
import { EnhancementSessionModule } from './enhancement-session/enhancement-session.module';
import { EnhancementSuggestionModule } from './enhancement-suggestion/enhancement-suggestion.module';

@Module({
  imports: [AuthModule, EnhancementSessionModule, EnhancementSuggestionModule],
  controllers: [EnhancementAiController],
  providers: [EnhancementAiService],
  exports: [EnhancementAiService],
})
export class EnhancementModule {}
