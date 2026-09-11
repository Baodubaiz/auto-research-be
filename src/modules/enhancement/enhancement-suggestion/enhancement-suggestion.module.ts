import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth/auth.module';
import { EnhancementSuggestionController } from './enhancement-suggestion.controller';
import { EnhancementSuggestionRouteController } from './enhancement-suggestion-route.controller';
import { EnhancementSuggestionService } from './enhancement-suggestion.service';

@Module({
  imports: [AuthModule],
  controllers: [EnhancementSuggestionController, EnhancementSuggestionRouteController],
  providers: [EnhancementSuggestionService],
  exports: [EnhancementSuggestionService],
})
export class EnhancementSuggestionModule {}