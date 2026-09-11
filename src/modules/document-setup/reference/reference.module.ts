import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth/auth.module';
import { ReferenceController } from './reference.controller';
import { ReferenceService } from './reference.service';

@Module({ imports: [AuthModule], controllers: [ReferenceController], providers: [ReferenceService], exports: [ReferenceService] })
export class ReferenceModule {}