import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth/auth.module';
import { ReportController } from './report.controller';
import { DocumentReportController } from './document-report.controller';
import { ReportService } from './report.service';

@Module({ imports: [AuthModule], controllers: [ReportController, DocumentReportController], providers: [ReportService], exports: [ReportService] })
export class ReportModule {}