import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth/auth.module';
import { OutlineController } from './outline.controller';
import { OutlineService } from './outline.service';

@Module({ imports: [AuthModule], controllers: [OutlineController], providers: [OutlineService], exports: [OutlineService] })
export class OutlineModule {}