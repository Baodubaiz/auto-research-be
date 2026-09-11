import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth/auth.module';
import { DatasetController } from './dataset.controller';
import { DatasetService } from './dataset.service';

@Module({ imports: [AuthModule], controllers: [DatasetController], providers: [DatasetService], exports: [DatasetService] })
export class DatasetModule {}