import { Module } from '@nestjs/common';
import { DataAnalysisModule } from './data-analysis/data-analysis.module';
import { DatasetModule } from './dataset/dataset.module';
import { DatasetVariableModule } from './dataset-variable/dataset-variable.module';
import { GeneratedSlideModule } from './generated-slide/generated-slide.module';
import { ProposedMethodModule } from './proposed-method/proposed-method.module';
import { ReportModule } from './report/report.module';

@Module({
  imports: [
    ReportModule,
    DatasetModule,
    DataAnalysisModule,
    DatasetVariableModule,
    ProposedMethodModule,
    GeneratedSlideModule,
  ],
})
export class WriteReportModule {}
