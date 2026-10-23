import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth/auth.module';
import { DataAnalysisAiService } from './data-analysis-ai.service';
import { DataAnalysisController } from './data-analysis.controller';

@Module({
  imports: [AuthModule],
  controllers: [DataAnalysisController],
  providers: [DataAnalysisAiService],
  exports: [DataAnalysisAiService],
})
export class DataAnalysisModule {}
