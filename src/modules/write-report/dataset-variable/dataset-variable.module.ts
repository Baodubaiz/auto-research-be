import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth/auth.module';
import { DatasetVariableController } from './dataset-variable.controller';
import { DatasetVariableDocumentController } from './dataset-variable-document.controller';
import { DatasetVariableService } from './dataset-variable.service';

@Module({ imports: [AuthModule], controllers: [DatasetVariableController, DatasetVariableDocumentController], providers: [DatasetVariableService], exports: [DatasetVariableService] })
export class DatasetVariableModule {}