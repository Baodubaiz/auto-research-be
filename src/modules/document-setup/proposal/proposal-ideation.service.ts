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
    return this.dispatcher.dispatch({
      userId,
      documentId: dto.documentId,
      sessionId: dto.sessionId,
      eventType: 'generate_domains',
      errorCode: 611,
      dto,
      kafkaData: {
        field: dto.field || doc.field || 'General',
        number_of_domains: dto.numberOfDomains,
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
    await this.ensureDocument(userId, dto.documentId);
    return this.dispatcher.dispatch({
      userId,
      documentId: dto.documentId,
      sessionId: dto.sessionId,
      eventType: 'generate_subdomains',
      errorCode: 612,
      dto,
      kafkaData: {
        field: dto.field,
        domain: dto.domain,
        number_of_subdomains: dto.numberOfSubdomains,
      },
    });
  }

  async generateKeywords(userId: string, dto: GenerateKeywordsDto) {
    await this.ensureDocument(userId, dto.documentId);
    return this.dispatcher.dispatch({
      userId,
      documentId: dto.documentId,
      sessionId: dto.sessionId,
      eventType: 'generate_keywords',
      errorCode: 613,
      dto,
      kafkaData: {
        field: dto.field,
        domain: dto.domain,
        subdomains: dto.subdomains ?? [],
      },
      onSuccess: async (data) => {
        const main = (data.keywords_main ||
          data.keywordsMain ||
          []) as unknown[];
        const sub = (data.keywords_sub || data.keywordsSub || []) as unknown[];
        if (main.length > 0 || sub.length > 0) {
          await this.saveKeywords(dto.documentId, main, sub);
        }
      },
    });
  }

  async generateTitles(userId: string, dto: GenerateTitlesDto) {
    await this.ensureDocument(userId, dto.documentId);
    return this.dispatcher.dispatch({
      userId,
      documentId: dto.documentId,
      sessionId: dto.sessionId,
      eventType: 'generate_titles',
      errorCode: 614,
      dto,
      kafkaData: {
        field: dto.field,
        domain: dto.domain,
        subdomains: dto.subdomains ?? [],
        keywords: dto.keywords ?? [],
      },
    });
  }

  async ensureDocument(userId: string, id: string) {
    const doc = await this.prisma.document.findFirst({ where: { id, userId } });
    if (!doc) throw new NotFoundException('Document not found');
    return doc;
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
