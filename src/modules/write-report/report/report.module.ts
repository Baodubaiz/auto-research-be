import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth/auth.module';
import { ReportController } from './report.controller';
import { DocumentReportController } from './document-report.controller';
import { WriteContentStreamController } from './write-content-stream.controller';
import { ReportService } from './report.service';
import { WriteContentAiService } from './write-content-ai.service';

@Module({
  imports: [AuthModule],
  controllers: [
    ReportController,
    DocumentReportController,
    WriteContentStreamController,
  ],
  providers: [ReportService, WriteContentAiService],
  exports: [ReportService, WriteContentAiService],
})
export class ReportModule {}
