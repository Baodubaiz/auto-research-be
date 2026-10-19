import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { ProposalAiDispatcher } from './proposal-ai.dispatcher';
import {
  GenerateDomainsDto,
  GenerateKeywordsDto,
  GenerateSubdomainsDto,
  GenerateTitlesDto,
} from './dto/generate-ideation.dto';

@Injectable()
export class ProposalIdeationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dispatcher: ProposalAiDispatcher,
  ) {}

  async generateDomains(userId: string, dto: GenerateDomainsDto) {
    const doc = await this.ensureDocument(userId, dto.documentId);
    const num = dto.domainsNum || dto.numberOfDomains || 5;
    return this.dispatcher.dispatch({
      userId,
      documentId: dto.documentId,
      sessionId: dto.sessionId,
      eventType: 'generate_domains',
      errorCode: 611,
      dto,
      kafkaData: {
        field: dto.field || doc.field || 'General',
        domains_num: num,
        number_of_domains: num,
        is_tool: dto.isTool ?? false,
      },
      onSuccess: async (data) => {
        const domains = data.domains || data.data;
        if (domains) {
          await this.prisma.document.update({
            where: { id: dto.documentId },
            data: { domains: domains as Prisma.InputJsonValue },
          });
        }
      },
    });
  }

  async generateSubdomains(userId: string, dto: GenerateSubdomainsDto) {
    const doc = await this.ensureDocument(userId, dto.documentId);
    const num = dto.subdomainsNum || dto.numberOfSubdomains || 5;
    return this.dispatcher.dispatch({
      userId,
      documentId: dto.documentId,
      sessionId: dto.sessionId,
      eventType: 'generate_subdomains',
      errorCode: 612,
      dto,
      kafkaData: {
        field: dto.field || doc.field || 'General',
        domain: this.resolveDomain(dto.domain, doc.domains),
        subdomains_num: num,
        number_of_subdomains: num,
        is_tool: dto.isTool ?? false,
      },
      onSuccess: async (data) => {
        const subdomains = data.subdomains || data.data;
        if (subdomains) {
          await this.prisma.document.update({
            where: { id: dto.documentId },
            data: { subdomains: subdomains as Prisma.InputJsonValue },
          });
        }
      },
    });
  }

  async generateKeywords(userId: string, dto: GenerateKeywordsDto) {
    const doc = await this.ensureDocument(userId, dto.documentId);
    const proposal = await this.resolveProposal(dto);

    return this.dispatcher.dispatch({
      userId,
      documentId: dto.documentId,
      sessionId: dto.sessionId,
      eventType: 'generate_keywords',
      errorCode: 613,
      dto,
      kafkaData: {
        field: dto.field || doc.field || 'General',
        domain: this.resolveDomain(dto.domain, doc.domains),
        subdomains: dto.subdomains ?? [],
        ...(proposal ? { proposal } : {}),
      },
      onSuccess: async (data) => {
        const kwObj =
          data.keywords && typeof data.keywords === 'object'
            ? (data.keywords as Record<string, unknown>)
            : {};
        const main = (data.keywords_main ||
          data.keywordsMain ||
          data.main_keywords ||
          kwObj.main_keywords ||
          []) as unknown[];
        const sub = (data.keywords_sub ||
          data.keywordsSub ||
          data.sub_keywords ||
          kwObj.sub_keywords ||
          []) as unknown[];
        if (main.length > 0 || sub.length > 0) {
          await this.saveKeywords(dto.documentId, main, sub);
        }
      },
    });
  }

  async generateTitles(userId: string, dto: GenerateTitlesDto) {
    const doc = await this.ensureDocument(userId, dto.documentId);
    return this.dispatcher.dispatch({
      userId,
      documentId: dto.documentId,
      sessionId: dto.sessionId,
      eventType: 'generate_titles',
      errorCode: 614,
      dto,
      kafkaData: {
        field: dto.field || doc.field || 'General',
        domain: this.resolveDomain(dto.domain, doc.domains),
        subdomains: dto.subdomains ?? [],
        keywords: dto.keywords ?? [],
        level: dto.level || 'bachelor',
        use_web_search: dto.useWebSearch ?? false,
      },
      onSuccess: async (data) => {
        await this.saveGeneratedTitles(dto.documentId, data);
      },
    });
  }

  async ensureDocument(userId: string, id: string) {
    const doc = await this.prisma.document.findFirst({ where: { id, userId } });
    if (!doc) throw new NotFoundException('Document not found');
    return doc;
  }

  private resolveDomain(dtoDomain?: string, docDomains?: unknown): string {
    if (dtoDomain) return dtoDomain;
    if (Array.isArray(docDomains) && docDomains.length > 0) return String(docDomains[0]);
    return typeof docDomains === 'string' && docDomains ? docDomains : 'General';
  }

  private async resolveProposal(dto: GenerateKeywordsDto) {
    if (dto.proposal) return dto.proposal;
    if (dto.proposalId) {
      const p = await this.prisma.proposal.findUnique({
        where: { id: dto.proposalId },
      });
      if (p) {
        return {
          title: p.title,
          problem_statement: p.problemStatement || '',
          motivation: p.motivation || '',
          research_gap: p.researchGap || '',
        };
      }
    }
    const selected = await this.prisma.proposal.findFirst({
      where: { documentId: dto.documentId, isSelected: true },
    });
    if (selected) {
      return {
        title: selected.title,
        problem_statement: selected.problemStatement || '',
        motivation: selected.motivation || '',
        research_gap: selected.researchGap || '',
      };
    }
    return undefined;
  }

  private async saveGeneratedTitles(
    docId: string,
    data: Record<string, unknown>,
  ) {
    const proposals = (data.proposals || data.data || []) as Array<{
      title?: string;
      problem_statement?: string;
      problemStatement?: string;
      motivation?: string;
      research_gap?: string;
      researchGap?: string;
    }>;

    for (const p of proposals) {
      if (p.title) {
        await this.prisma.proposal.create({
          data: {
            documentId: docId,
            title: p.title,
            problemStatement: p.problem_statement || p.problemStatement || null,
            motivation: p.motivation || null,
            researchGap: p.research_gap || p.researchGap || null,
            isSelected: false,
          },
        });
      }
    }
  }

  private async saveKeywords(docId: string, main: unknown[], sub: unknown[]) {
    const exist = await this.prisma.documentKeyword.findFirst({
      where: { documentId: docId },
    });
    const data = {
      keywordsMain: main as Prisma.InputJsonValue,
      keywordsSub: sub as Prisma.InputJsonValue,
    };
    if (exist) {
      await this.prisma.documentKeyword.update({
        where: { id: exist.id },
        data,
      });
    } else {
      await this.prisma.documentKeyword.create({
        data: { documentId: docId, ...data },
      });
    }
  }
}
