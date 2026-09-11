import { Module } from '@nestjs/common';
import { EnhancementSessionModule } from './enhancement-session/enhancement-session.module';
import { EnhancementSuggestionModule } from './enhancement-suggestion/enhancement-suggestion.module';

@Module({
  imports: [EnhancementSessionModule, EnhancementSuggestionModule],
})
export class EnhancementModule {}