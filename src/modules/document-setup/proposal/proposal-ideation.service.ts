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
import { normalizeAcademicLevel } from '../../../common/helpers/academic-level.helper';

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
          const normalized =
            Array.isArray(domains) && typeof domains[0] === 'string'
              ? domains.map((d: string, idx: number) => ({
                  id: `domain-${idx + 1}`,
                  domainName: d,
                  subdomains: [],
                }))
              : domains;
          await this.prisma.document.update({
            where: { id: dto.documentId },
            data: { domains: normalized as Prisma.InputJsonValue },
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
        const subdomains = (data.subdomains || data.data || []) as string[];
        if (subdomains.length > 0) {
          let updatedDomains = doc.domains;
          if (Array.isArray(doc.domains)) {
            const targetDomain = this.resolveDomain(dto.domain, doc.domains);
            updatedDomains = (doc.domains as any[]).map((d: any) => {
              const dName = typeof d === 'string' ? d : d.domainName || d.name;
              if (
                dName === targetDomain ||
                (doc.domains as any[]).length === 1
              ) {
                const existing = Array.isArray(d.subdomains) ? d.subdomains : [];
                const merged = Array.from(
                  new Set([...existing, ...subdomains]),
                );
                return typeof d === 'string'
                  ? { id: `domain-${d}`, domainName: d, subdomains: merged }
                  : { ...d, subdomains: merged };
              }
              return d;
            });
          }
          await this.prisma.document.update({
            where: { id: dto.documentId },
            data: {
              subdomains: subdomains as Prisma.InputJsonValue,
              domains: updatedDomains as Prisma.InputJsonValue,
            },
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
        subdomains: this.resolveSubdomains(dto.subdomains, doc),
        keywords: dto.keywords ?? [],
        level: normalizeAcademicLevel(
          dto.level || doc.documentType || undefined,
        ),
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

  resolveDomain(dtoDomain?: string, docDomains?: unknown): string {
    if (dtoDomain && dtoDomain !== '[object Object]') return dtoDomain;
    if (Array.isArray(docDomains) && docDomains.length > 0) {
      const first = docDomains[0];
      if (typeof first === 'string') return first;
      if (first && typeof first === 'object') {
        const obj = first as Record<string, unknown>;
        return String(obj.domainName || obj.name || obj.title || 'General');
      }
    }
    return typeof docDomains === 'string' && docDomains
      ? docDomains
      : 'General';
  }

  resolveSubdomains(dtoSubs?: string[], doc?: any): string[] {
    if (Array.isArray(dtoSubs) && dtoSubs.length > 0) return dtoSubs;
    if (Array.isArray(doc?.subdomains) && doc.subdomains.length > 0) {
      return (doc.subdomains as any[]).map((s) =>
        typeof s === 'string' ? s : String(s.name || s),
      );
    }
    if (Array.isArray(doc?.domains)) {
      const all: string[] = [];
      for (const d of doc.domains) {
        if (d && Array.isArray(d.subdomains)) {
          all.push(...d.subdomains);
        }
      }
      if (all.length > 0) return all;
    }
    return [this.resolveDomain(undefined, doc?.domains)];
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
