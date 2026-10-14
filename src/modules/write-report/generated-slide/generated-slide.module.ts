import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth/auth.module';
import { GeneratedSlideController } from './generated-slide.controller';
import { DocumentGeneratedSlideController } from './document-generated-slide.controller';
import { GeneratedSlideService } from './generated-slide.service';
import { GeneratedSlideAiService } from './generated-slide-ai.service';

@Module({
  imports: [AuthModule],
  controllers: [GeneratedSlideController, DocumentGeneratedSlideController],
  providers: [GeneratedSlideService, GeneratedSlideAiService],
  exports: [GeneratedSlideService, GeneratedSlideAiService],
})
export class GeneratedSlideModule {}
