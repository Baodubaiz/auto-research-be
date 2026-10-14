import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { ProposalAiDispatcher } from './proposal-ai.dispatcher';
import {
  GenerateTitleDescriptionDto,
  GenerateTitleDescriptionNoInfoDto,
  GetResearchTypeDto,
  MixTitlesDto,
} from './dto/proposal-details.dto';

@Injectable()
export class ProposalDetailsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dispatcher: ProposalAiDispatcher,
  ) {}

  generateTitleDescription(userId: string, dto: GenerateTitleDescriptionDto) {
    return this.runTitleDescription(userId, dto, false);
  }

  generateTitleDescriptionNoInfo(
    userId: string,
    dto: GenerateTitleDescriptionNoInfoDto,
  ) {
    return this.runTitleDescription(userId, dto, true);
  }

  private async runTitleDescription(
    userId: string,
    dto: GenerateTitleDescriptionDto | GenerateTitleDescriptionNoInfoDto,
    noInfo: boolean,
  ) {
    await this.ensureDocument(userId, dto.documentId);
    const eventType = noInfo
      ? 'generate_title_description_no_info'
      : 'generate_title_description';
    const kafkaData = noInfo
      ? {
          title: dto.title,
          description: (dto as GenerateTitleDescriptionNoInfoDto).description,
        }
      : {
          title: dto.title,
          field: (dto as GenerateTitleDescriptionDto).field,
          domain: (dto as GenerateTitleDescriptionDto).domain,
          subdomains: (dto as GenerateTitleDescriptionDto).subdomains ?? [],
          keywords: (dto as GenerateTitleDescriptionDto).keywords ?? [],
        };

    return this.dispatcher.dispatch({
      userId,
      documentId: dto.documentId,
      sessionId: dto.sessionId,
      eventType,
      errorCode: noInfo ? 624 : 615,
      dto,
      kafkaData,
      onSuccess: async (data) => {
        await this.upsertDescription(
          dto.documentId,
          dto.title,
          data,
          dto.proposalId,
        );
      },
    });
  }

  async mixTitles(userId: string, dto: MixTitlesDto) {
    await this.ensureDocument(userId, dto.documentId);
    return this.dispatcher.dispatch({
      userId,
      documentId: dto.documentId,
      sessionId: dto.sessionId,
      eventType: 'mix_titles',
      errorCode: 616,
      dto,
      kafkaData: { titles: dto.titles, field: dto.field },
      onSuccess: async (data) => {
        const proposals = (data.proposals || data.data || []) as Array<{
          title: string;
          problemStatement?: string;
          motivation?: string;
        }>;
        for (const p of proposals) {
          if (p.title) {
            await this.prisma.proposal.create({
              data: {
                documentId: dto.documentId,
                title: p.title,
                problemStatement: p.problemStatement || null,
                motivation: p.motivation || null,
              },
            });
          }
        }
      },
    });
  }

  async getResearchType(userId: string, dto: GetResearchTypeDto) {
    await this.ensureDocument(userId, dto.documentId);
    return this.dispatcher.dispatch({
      userId,
      documentId: dto.documentId,
      sessionId: dto.sessionId,
      eventType: 'get_research_type',
      errorCode: 623,
      dto,
      kafkaData: {
        title: dto.title,
        problem_statement: dto.problemStatement,
        motivation: dto.motivation,
      },
      onSuccess: async (data) => {
        const rType = data.research_type || data.researchType || data.type;
        if (typeof rType === 'string') {
          await this.prisma.document.update({
            where: { id: dto.documentId },
            data: { researchType: rType },
          });
        }
      },
    });
  }

  async ensureDocument(userId: string, id: string) {
    const doc = await this.prisma.document.findFirst({ where: { id, userId } });
    if (!doc) throw new NotFoundException('Document not found');
    return doc;
  }

  private async upsertDescription(
    docId: string,
    title: string,
    data: Record<string, unknown>,
    proposalId?: string,
  ) {
    const updateData = {
      problemStatement: String(
        data.problem_statement || data.problemStatement || '',
      ),
      motivation: String(data.motivation || ''),
    };
    if (proposalId) {
      await this.prisma.proposal.update({
        where: { id: proposalId },
        data: updateData,
      });
      return;
    }
    const exist = await this.prisma.proposal.findFirst({
      where: { documentId: docId, title },
    });
    if (exist) {
      await this.prisma.proposal.update({
        where: { id: exist.id },
        data: updateData,
      });
    } else {
      await this.prisma.proposal.create({
        data: { documentId: docId, title, ...updateData },
      });
    }
  }
}
