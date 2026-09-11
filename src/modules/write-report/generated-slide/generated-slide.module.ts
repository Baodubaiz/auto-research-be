import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth/auth.module';
import { GeneratedSlideController } from './generated-slide.controller';
import { DocumentGeneratedSlideController } from './document-generated-slide.controller';
import { GeneratedSlideService } from './generated-slide.service';

@Module({ imports: [AuthModule], controllers: [GeneratedSlideController, DocumentGeneratedSlideController], providers: [GeneratedSlideService], exports: [GeneratedSlideService] })
export class GeneratedSlideModule {}