import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { OutlineAiDispatcher } from './outline-ai.dispatcher';
import {
  GenerateOutlineAiDto,
  GenerateOutlineWithRefsDto,
  ModifyOutlineAiDto,
  UpdateUserRefsDto,
} from './dto/outline-ai.dto';

@Injectable()
export class OutlineAiService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dispatcher: OutlineAiDispatcher,
  ) {}

  async generateOutline(userId: string, dto: GenerateOutlineAiDto) {
    const doc = await this.ensureDocument(userId, dto.documentId);
    let title = dto.title || doc.title || '';
    let problem = dto.problemStatement || '';

    if (dto.proposalId) {
      const prop = await this.prisma.proposal.findFirst({
        where: { id: dto.proposalId, documentId: dto.documentId },
      });
      if (prop) {
        title = prop.title || title;
        problem = prop.problemStatement || problem;
      }
    }

    return this.dispatcher.dispatch({
      userId,
      documentId: dto.documentId,
      sessionId: dto.sessionId,
      eventType: 'generate_outline',
      errorCode: 617,
      dto,
      kafkaData: {
        title,
        problem_statement: problem,
        total_word_count: dto.totalWordCount || 8000,
        research_type: dto.researchType || doc.researchType || 'quantitative',
        field: dto.field || doc.field || 'General',
      },
      onSuccess: async (data) => {
        await this.upsertOutlineRecord(
          dto.documentId,
          data,
          dto.totalWordCount,
        );
      },
    });
  }

  async modifyOutline(userId: string, dto: ModifyOutlineAiDto) {
    await this.ensureDocument(userId, dto.documentId);
    let currentOutline = dto.outline;
    if (!currentOutline) {
      const existing = await this.prisma.outline.findUnique({
        where: { documentId: dto.documentId },
      });
      currentOutline = (existing?.structure as Record<string, unknown>) || {};
    }

    return this.dispatcher.dispatch({
      userId,
      documentId: dto.documentId,
      sessionId: dto.sessionId,
      eventType: 'modify_outline',
      errorCode: 627,
      dto,
      kafkaData: {
        instruction: dto.instruction,
        outline: currentOutline,
      },
      onSuccess: async (data) => {
        await this.upsertOutlineRecord(dto.documentId, data);
      },
    });
  }

  async generateOutlineWithRefs(
    userId: string,
    dto: GenerateOutlineWithRefsDto,
  ) {
    await this.ensureDocument(userId, dto.documentId);
    let currentOutline = dto.outline;
    if (!currentOutline) {
      const existing = await this.prisma.outline.findUnique({
        where: { documentId: dto.documentId },
      });
      currentOutline = (existing?.structure as Record<string, unknown>) || {};
    }

    return this.dispatcher.dispatch({
      userId,
      documentId: dto.documentId,
      sessionId: dto.sessionId,
      eventType: 'generate_outline_with_refs',
      errorCode: 626,
      dto,
      kafkaData: {
        outline: currentOutline,
        reference_ids: dto.referenceIds ?? [],
      },
      onSuccess: async (data) => {
        await this.upsertOutlineRecord(dto.documentId, data);
      },
    });
  }

  async updateUserRefs(userId: string, dto: UpdateUserRefsDto) {
    await this.ensureDocument(userId, dto.documentId);

    return this.dispatcher.dispatch({
      userId,
      documentId: dto.documentId,
      sessionId: dto.sessionId,
      eventType: 'update_user_refs',
      errorCode: 628,
      dto,
      kafkaData: {
        reference_ids: dto.referenceIds,
      },
      onSuccess: async () => {
        for (const refId of dto.referenceIds) {
          const exists = await this.prisma.documentReference.findUnique({
            where: {
              documentId_referenceId: {
                documentId: dto.documentId,
                referenceId: refId,
              },
            },
          });
          if (!exists) {
            await this.prisma.documentReference.create({
              data: { documentId: dto.documentId, referenceId: refId },
            });
          }
        }
      },
    });
  }

  async ensureDocument(userId: string, id: string) {
    const doc = await this.prisma.document.findFirst({ where: { id, userId } });
    if (!doc) throw new NotFoundException('Document not found');
    return doc;
  }

  private async upsertOutlineRecord(
    docId: string,
    data: Record<string, unknown>,
    fallbackCount?: number,
  ) {
    const struct = data.outline || data.structure || data;
    const count = Number(
      data.total_word_count || data.totalWordCount || fallbackCount || 8000,
    );
    await this.prisma.outline.upsert({
      where: { documentId: docId },
      update: {
        totalWordCount: count,
        structure: struct as Prisma.InputJsonValue,
      },
      create: {
        documentId: docId,
        totalWordCount: count,
        structure: struct as Prisma.InputJsonValue,
      },
    });
  }
}
