import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth/auth.module';
import { ProposalController } from './proposal.controller';
import { ProposalService } from './proposal.service';
import { ProposalIdeationService } from './proposal-ideation.service';
import { ProposalDetailsService } from './proposal-details.service';
import { ProposalAiDispatcher } from './proposal-ai.dispatcher';

@Module({
  imports: [AuthModule],
  controllers: [ProposalController],
  providers: [
    ProposalService,
    ProposalAiDispatcher,
    ProposalIdeationService,
    ProposalDetailsService,
  ],
  exports: [
    ProposalService,
    ProposalAiDispatcher,
    ProposalIdeationService,
    ProposalDetailsService,
  ],
})
export class ProposalModule {}
