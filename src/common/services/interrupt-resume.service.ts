import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JobStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { JobsKafkaProducer } from '../../modules/jobs/kafka/jobs-kafka.producer';

export const INTERRUPTIBLE_EVENTS = [
  'writer_chatbot',
  'propose_method',
  'writer',
] as const;

export function isInterruptibleEvent(eventType: string): boolean {
  return (INTERRUPTIBLE_EVENTS as readonly string[]).includes(eventType);
}

@Injectable()
export class InterruptResumeService {
  private readonly logger = new Logger(InterruptResumeService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly kafkaProducer?: JobsKafkaProducer,
    @Optional() private readonly configService?: ConfigService,
  ) {}

  isSuspendedPayload(
    payload: Record<string, unknown>,
    eventType?: string,
  ): boolean {
    if (!payload || typeof payload !== 'object') return false;

    if (payload.done_chat === false) return true;
    if (payload.action_required === 'user_input') return true;

    const event = String(eventType || payload.event_type || '');
    if (isInterruptibleEvent(event) && payload.has_finished === false) {
      return true;
    }

    return false;
  }

  async suspendJob(
    jobId: string,
    payload: Record<string, unknown>,
    customStep?: string,
  ): Promise<void> {
    const step =
      customStep ||
      (payload.step ? String(payload.step) : undefined) ||
      (payload.action_required ? String(payload.action_required) : undefined) ||
      'user_input_required';

    const resultData = (payload.data ??
      payload.response ??
      payload) as Prisma.InputJsonValue;

    try {
      await this.prisma.job.update({
        where: { id: jobId },
        data: {
          status: JobStatus.suspended,
          resumeStep: step,
          result: resultData,
        },
      });
      this.logger.log(
        `Job [${jobId}] moved to suspended state at step [${step}]`,
      );
    } catch (error) {
      this.logger.warn(
        `Failed to suspend job [${jobId}]: ${(error as Error).message}`,
      );
    }
  }

  async resumeJob(jobId: string, userInput?: unknown, resumeStep?: string) {
    const job = await this.prisma.job.findUnique({ where: { id: jobId } });
    if (!job) {
      throw new NotFoundException(`Job [${jobId}] not found`);
    }

    if (job.status !== JobStatus.suspended) {
      throw new BadRequestException(
        `Cannot resume job with status [${job.status}]. Job must be suspended.`,
      );
    }

    const currentPayload =
      typeof job.payload === 'object' && job.payload !== null
        ? (job.payload as Record<string, unknown>)
        : {};

    const nextPayload: Record<string, unknown> = {
      ...currentPayload,
      resume: true,
      user_input: userInput,
      resumed_at: new Date().toISOString(),
    };

    const nextStep = resumeStep || job.resumeStep || 'resumed';

    const updatedJob = await this.prisma.job.update({
      where: { id: jobId },
      data: {
        status: JobStatus.pending,
        resumeStep: nextStep,
        payload: nextPayload as Prisma.InputJsonValue,
        errorCode: null,
        errorMessage: null,
      },
    });

    const kafkaEnabled =
      this.configService?.get<boolean>('kafka.enabled', true) ?? true;

    if (kafkaEnabled && this.kafkaProducer) {
      await this.kafkaProducer.publishJob(updatedJob);
      this.logger.log(
        `Resumed job [${jobId}] republished to Kafka at step [${nextStep}]`,
      );
    } else {
      this.logger.debug(
        `Job [${jobId}] resumed in pending state (Kafka publish deferred or offline)`,
      );
    }

    return {
      job_id: updatedJob.id,
      id: updatedJob.id,
      status: updatedJob.status,
      resumeStep: updatedJob.resumeStep,
      message: 'Job successfully resumed',
    };
  }
}
