import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JobStatus, ModuleType, Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { KafkaProducerService } from '../../../messaging/kafka-producer.service';
import { RequestCorrelationService } from '../../../messaging/request-correlation.service';
import { StreamingManagerService } from '../../../common/streaming/streaming-manager.service';
import { WriteContentRequestDto } from './dto/write-content-request.dto';
import { WriteContentHelper } from './write-content.helper';
import { getAiErrorMessage } from '../../../common/constants/ai-error-codes';

@Injectable()
export class WriteContentAiService {
  private readonly logger = new Logger(WriteContentAiService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly kafkaProducer: KafkaProducerService,
    private readonly correlation: RequestCorrelationService,
    private readonly streamingManager: StreamingManagerService,
    private readonly configService: ConfigService,
  ) {}

  async startWriteContent(userId: string, dto: WriteContentRequestDto) {
    await this.ensureOwnedDocument(userId, dto.documentId);

    const job = await this.prisma.job.create({
      data: {
        module: ModuleType.write_report,
        action: 'write_content',
        documentId: dto.documentId,
        status: JobStatus.pending,
        payload: dto as unknown as Prisma.InputJsonValue,
      },
    });

    const streamKey = this.streamingManager.buildStreamKey({
      userId,
      documentId: dto.documentId,
      eventType: 'write_content',
    });

    const corrKey = this.correlation.buildCorrelationKey({
      userId,
      documentId: dto.documentId,
      eventType: 'write_content',
    });

    const streamObservable =
      this.correlation.getStreamObservable<Record<string, unknown>>(corrKey);
    const pendingPromise = this.correlation.registerPending<
      Record<string, unknown>
    >(corrKey, 1500000, 'write_content', job.id);

    const payload = {
      event_type: 'write_content',
      user_id: userId,
      document_id: dto.documentId,
      field: dto.field,
      domain: dto.domain,
      references_style: dto.referencesStyle || 'APA',
      final_proposal: dto.finalProposal,
      papers_search: dto.papersSearch || [],
      outline: dto.outline,
      outline_code: dto.outlineCode || 'all',
      model_id: dto.modelId || 'localhost',
      language: dto.language || 'vi',
      job_id: job.id,
    };

    const topic =
      this.configService.get<string>('kafka.topics.write_report.request') ||
      'write_section_request_local';

    try {
      await this.kafkaProducer.publish(topic, payload);
      await this.prisma.job.update({
        where: { id: job.id },
        data: { status: JobStatus.processing },
      });
    } catch (publishErr) {
      this.correlation.clearPending(corrKey, (publishErr as Error).message);
      return WriteContentHelper.failJob(
        this.prisma,
        job.id,
        630,
        getAiErrorMessage(630),
      );
    }

    const sectionsMap = new Map<string, string>();
    const subscription = streamObservable.subscribe({
      next: async (chunk: Record<string, unknown>) => {
        try {
          const markdown = WriteContentHelper.extractMarkdown(
            sectionsMap,
            chunk,
          );
          if (markdown) {
            await this.prisma.report.upsert({
              where: { documentId: dto.documentId },
              update: { contentMarkdown: markdown },
              create: { documentId: dto.documentId, contentMarkdown: markdown },
            });
          }

          if (chunk.has_finished === true) {
            await this.prisma.job.update({
              where: { id: job.id },
              data: {
                status: JobStatus.finished,
                result: chunk as unknown as Prisma.InputJsonValue,
              },
            });
            this.streamingManager.completeStream(streamKey);
            subscription.unsubscribe();
          }
        } catch (err) {
          this.logger.error(
            `Error saving write_content section: ${(err as Error).message}`,
          );
        }
      },
      error: async (err: unknown) => {
        const errorMsg = (err as Error)?.message || getAiErrorMessage(630);
        await this.prisma.job.update({
          where: { id: job.id },
          data: {
            status: JobStatus.error,
            errorCode: '630',
            errorMessage: errorMsg,
          },
        });
        this.streamingManager.destroyStream(streamKey);
        subscription.unsubscribe();
      },
    });

    void pendingPromise.catch(async (err: unknown) => {
      const code = (err as Record<string, unknown>)?.error_code || '630';
      const msg =
        (err as Record<string, unknown>)?.error ||
        (err as Error)?.message ||
        getAiErrorMessage(630);

      await this.prisma.job.update({
        where: { id: job.id },
        data: {
          status: JobStatus.error,
          errorCode: String(code),
          errorMessage: String(msg),
        },
      });
      this.streamingManager.destroyStream(streamKey);
      subscription.unsubscribe();
    });

    return { jobId: job.id, streamKey, status: 'started' };
  }

  async getWriteStream(userId: string, documentId: string) {
    await this.ensureOwnedDocument(userId, documentId);
    const streamKey = this.streamingManager.buildStreamKey({
      userId,
      documentId,
      eventType: 'write_content',
    });
    return this.streamingManager.createStream(streamKey, 1500000);
  }

  async ensureOwnedDocument(userId: string, documentId: string) {
    const doc = await this.prisma.document.findUnique({
      where: { id: documentId, userId },
      select: { id: true },
    });
    if (!doc) throw new NotFoundException('Document not found');
    return doc;
  }
}
