import { Injectable, Logger } from '@nestjs/common';
import { JobStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { JobFallbackFixtures } from './job-fallback.fixtures';

@Injectable()
export class JobFallbackService {
  private readonly logger = new Logger(JobFallbackService.name);

  constructor(private readonly prisma: PrismaService) {}

  async processJobFallback(job: any) {
    const payloadData = (job.payload as any) || {};
    let resultData: any = {};

    try {
      if (job.module === 'document_setup') {
        resultData = await this.handleDocumentSetupFallback(
          job.action,
          job.documentId,
          payloadData,
        );
      } else {
        resultData = {
          message: `Completed action ${job.action} for ${job.module}`,
        };
      }

      return await this.prisma.job.update({
        where: { id: job.id },
        data: {
          status: JobStatus.finished,
          result: resultData as Prisma.InputJsonValue,
        },
      });
    } catch (err: any) {
      this.logger.error(
        `Fallback processing failed for job ${job.id}: ${err.message}`,
      );
      return await this.prisma.job.update({
        where: { id: job.id },
        data: {
          status: JobStatus.error,
          errorMessage: err.message,
        },
      });
    }
  }

  private async handleDocumentSetupFallback(
    action: string,
    documentId: string | null,
    payload: any,
  ) {
    const field = payload.field || 'Finance & Banking';

    switch (action) {
      case 'generate_domains':
        return this.fallbackDomains(documentId, field);
      case 'generate_subdomains':
        return this.fallbackSubdomains(documentId, field);
      case 'generate_titles':
        return this.fallbackTitles(documentId, field);
      case 'generate_keywords':
        return this.fallbackKeywords(documentId, field);
      case 'search_papers':
        return this.fallbackPapers(field);
      case 'generate_outline':
      case 'modify_outline':
        return this.fallbackOutline(documentId, field, payload);
      default:
        return { message: `Executed ${action} successfully` };
    }
  }

  private async fallbackDomains(documentId: string | null, field: string) {
    const domains = JobFallbackFixtures.getMockDomains(field);
    if (documentId) {
      await this.prisma.document.update({
        where: { id: documentId },
        data: { domains: domains as any },
      });
    }
    return { domains };
  }

  private async fallbackSubdomains(documentId: string | null, field: string) {
    const doc = documentId
      ? await this.prisma.document.findUnique({ where: { id: documentId } })
      : null;
    const currentDomains = Array.isArray(doc?.domains) ? (doc.domains as any[]) : [];
    const updatedDomains = JobFallbackFixtures.getMockSubdomains(field, currentDomains);

    if (documentId) {
      await this.prisma.document.update({
        where: { id: documentId },
        data: { domains: updatedDomains as any },
      });
    }
    return { domains: updatedDomains };
  }

  private async fallbackTitles(documentId: string | null, field: string) {
    if (!documentId) return { proposals: [] };
    const proposalsData = JobFallbackFixtures.getMockTitles(field);
    const createdProposals = [];
    for (const p of proposalsData) {
      const prop = await this.prisma.proposal.create({
        data: {
          documentId,
          title: p.title,
          problemStatement: p.problemStatement,
          motivation: p.motivation,
          isSelected: false,
        },
      });
      createdProposals.push(prop);
    }
    return { proposals: createdProposals };
  }

  private async fallbackKeywords(documentId: string | null, field: string) {
    const { keywordsMain, keywordsSub } = JobFallbackFixtures.getMockKeywords(field);
    if (documentId) {
      const existing = await this.prisma.documentKeyword.findFirst({
        where: { documentId },
      });
      const data = { keywordsMain: keywordsMain as any, keywordsSub: keywordsSub as any };
      if (existing) {
        await this.prisma.documentKeyword.update({ where: { id: existing.id }, data });
      } else {
        await this.prisma.documentKeyword.create({ data: { documentId, ...data } });
      }
    }
    return { keywordsMain, keywordsSub };
  }

  private async fallbackPapers(field: string) {
    const samplePapers = JobFallbackFixtures.getMockPapers(field);
    const createdRefs = [];
    for (const paper of samplePapers) {
      const ref = await this.prisma.reference.create({ data: paper });
      createdRefs.push(ref);
    }
    return { references: createdRefs };
  }

  private async fallbackOutline(documentId: string | null, field: string, payload: any) {
    const outlineStructure = JobFallbackFixtures.getMockOutline(field, payload);
    if (documentId) {
      const existing = await this.prisma.outline.findFirst({ where: { documentId } });
      const data = {
        totalWordCount: outlineStructure.totalWordCount,
        structure: outlineStructure as any,
      };
      if (existing) {
        await this.prisma.outline.update({ where: { id: existing.id }, data });
      } else {
        await this.prisma.outline.create({ data: { documentId, ...data } });
      }
    }
    return { outline: outlineStructure };
  }
}
