import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth/auth.module';
import { ProposedMethodController } from './proposed-method.controller';
import { DocumentProposedMethodController } from './document-proposed-method.controller';
import { ProposedMethodAiService } from './proposed-method-ai.service';
import { ProposedMethodService } from './proposed-method.service';

@Module({
  imports: [AuthModule],
  controllers: [ProposedMethodController, DocumentProposedMethodController],
  providers: [ProposedMethodService, ProposedMethodAiService],
  exports: [ProposedMethodService, ProposedMethodAiService],
})
export class ProposedMethodModule {}
