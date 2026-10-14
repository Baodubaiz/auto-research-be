import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth/auth.module';
import { OutlineController } from './outline.controller';
import { OutlineService } from './outline.service';
import { OutlineAiService } from './outline-ai.service';
import { OutlineAiDispatcher } from './outline-ai.dispatcher';

@Module({
  imports: [AuthModule],
  controllers: [OutlineController],
  providers: [OutlineService, OutlineAiDispatcher, OutlineAiService],
  exports: [OutlineService, OutlineAiDispatcher, OutlineAiService],
})
export class OutlineModule {}
