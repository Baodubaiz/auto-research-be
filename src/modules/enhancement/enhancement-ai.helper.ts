import { BadRequestException, NotFoundException } from '@nestjs/common';
import { JobStatus, ModuleType, Prisma, SuggestionStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { KafkaProducerService } from '../../messaging/kafka-producer.service';
import { RequestCorrelationService } from '../../messaging/request-correlation.service';

export class EnhancementAiHelper {
  static async ensureOwnedDocument(
    prisma: PrismaService,
    userId: string,
    documentId: string,
  ) {
    const doc = await prisma.document.findUnique({
      where: { id: documentId, userId },
      select: { id: true },
    });
    if (!doc) {
      throw new NotFoundException(
        `Document [${documentId}] not found or access denied`,
      );
    }
    return doc;
  }

  static async resolveProposal(
    prisma: PrismaService,
    documentId: string,
    override?: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    if (override && Object.keys(override).length > 0) return override;
    const p =
      (await prisma.proposal.findFirst({
        where: { documentId, isSelected: true },
      })) ||
      (await prisma.proposal.findFirst({
        where: { documentId },
      }));
    return {
      title: p?.title || '',
      problem_statement: p?.problemStatement || '',
    };
  }

  static async saveSuggestions(
    prisma: PrismaService,
    sessionId: string,
    rawList?: Array<Record<string, unknown>>,
  ) {
    const suggestions: unknown[] = [];
    if (!Array.isArray(rawList)) return suggestions;

    for (const item of rawList) {
      const sug = await prisma.enhancementSuggestion.create({
        data: {
          sessionId,
          suggestedText: String(
            item.suggestion || item.suggestedText || item.original || '',
          ),
          explanation: String(item.reason || item.explanation || ''),
          status: SuggestionStatus.pending,
        },
      });
      suggestions.push(sug);
    }
    return suggestions;
  }

  static async executeAiFlow(
    prisma: PrismaService,
    producer: KafkaProducerService,
    correlation: RequestCorrelationService,
    topic: string,
    meta: {
      userId: string;
      documentId: string;
      sessionId: string;
      eventType: string;
      payloadDto: unknown;
    },
    kafkaPayload: Record<string, unknown>,
  ): Promise<{ jobId: string; res: Record<string, unknown> }> {
    const job = await prisma.job.create({
      data: {
        module: ModuleType.enhancement,
        action: meta.eventType,
        documentId: meta.documentId,
        sessionId: meta.sessionId,
        status: JobStatus.pending,
        payload: meta.payloadDto as Prisma.InputJsonValue,
      },
    });

    const corrKey = correlation.buildCorrelationKey({
      userId: meta.userId,
      documentId: meta.documentId,
      sessionId: meta.sessionId,
      eventType: meta.eventType,
    });
    const pendingPromise = correlation.registerPending<Record<string, unknown>>(
      corrKey,
      120000,
      meta.eventType,
      job.id,
    );

    try {
      await producer.publish(topic, { ...kafkaPayload, job_id: job.id });
      await prisma.job.update({
        where: { id: job.id },
        data: { status: JobStatus.processing },
      });
      const res = await pendingPromise;
      return { jobId: job.id, res };
    } catch (err) {
      correlation.clearPending(corrKey, (err as Error).message);
      await prisma.job
        .update({
          where: { id: job.id },
          data: {
            status: JobStatus.error,
            errorCode: '603',
            errorMessage: (err as Error).message,
          },
        })
        .catch(() => null);
      throw new BadRequestException(
        (err as Record<string, unknown>)?.error || (err as Error).message,
      );
    }
  }

  static async finishJob(
    prisma: PrismaService,
    jobId: string,
    res: Record<string, unknown>,
  ) {
    await prisma.job.update({
      where: { id: jobId },
      data: {
        status: JobStatus.finished,
        result: res as unknown as Prisma.InputJsonValue,
      },
    });
  }
}
