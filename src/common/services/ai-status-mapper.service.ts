import { Injectable, Logger, Optional } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  ProcessStatus,
  PROCESS_STATUS_NAMES,
  toJobStatus,
} from '../enums/process-status.enum';
import { getAiErrorName, getAiErrorMessage } from '../constants/ai-error-codes';

export interface NormalizedAiResponse<T = unknown> {
  processStatus: ProcessStatus;
  statusName: string;
  eventType?: string;
  errorCode?: number;
  errorName?: string;
  errorMessage?: string;
  data?: T;
  hasFinished?: boolean;
  doneChat?: boolean;
  raw?: Record<string, unknown>;
}

@Injectable()
export class AiStatusMapperService {
  private readonly logger = new Logger(AiStatusMapperService.name);

  constructor(@Optional() private readonly prisma?: PrismaService) {}

  normalizeResponse<T = unknown>(
    rawMessage: Record<string, unknown>,
  ): NormalizedAiResponse<T> {
    if (!rawMessage || typeof rawMessage !== 'object') {
      return {
        processStatus: ProcessStatus.ERROR,
        statusName: PROCESS_STATUS_NAMES[ProcessStatus.ERROR],
        errorCode: 603,
        errorName: getAiErrorName(603),
        errorMessage: getAiErrorMessage(603),
        raw: {},
      };
    }

    const eventType = rawMessage.event_type
      ? String(rawMessage.event_type)
      : undefined;

    // 1. Error check: has error_code
    if (rawMessage.error_code !== undefined && rawMessage.error_code !== null) {
      const code = Number(rawMessage.error_code);
      const rawError = rawMessage.error;
      const errorSuffix =
        typeof rawError === 'string' && rawError.trim().length > 0
          ? ` (${rawError})`
          : '';

      return {
        processStatus: ProcessStatus.ERROR,
        statusName: PROCESS_STATUS_NAMES[ProcessStatus.ERROR],
        eventType,
        errorCode: code,
        errorName: getAiErrorName(code),
        errorMessage: `${getAiErrorMessage(code)}${errorSuffix}`,
        data: rawMessage.data as T | undefined,
        raw: rawMessage,
      };
    }

    // Error string without code
    if (rawMessage.error) {
      return {
        processStatus: ProcessStatus.ERROR,
        statusName: PROCESS_STATUS_NAMES[ProcessStatus.ERROR],
        eventType,
        errorCode: 500,
        errorName: 'AI_ERROR',
        errorMessage: String(rawMessage.error),
        data: rawMessage.data as T | undefined,
        raw: rawMessage,
      };
    }

    // 2. Suspended check: done_chat === false or prompt asking for user reply
    const doneChat = rawMessage.done_chat as boolean | undefined;
    const hasFinished = rawMessage.has_finished as boolean | undefined;
    const isSuspended =
      doneChat === false || rawMessage.action_required === 'user_input';

    if (isSuspended) {
      return {
        processStatus: ProcessStatus.SUSPENDED,
        statusName: PROCESS_STATUS_NAMES[ProcessStatus.SUSPENDED],
        eventType,
        data: (rawMessage.data ?? rawMessage.response ?? rawMessage) as T,
        hasFinished: false,
        doneChat: false,
        raw: rawMessage,
      };
    }

    // 3. Processing check: streaming in progress (has_finished: false)
    if (hasFinished === false) {
      return {
        processStatus: ProcessStatus.PROCESSING,
        statusName: PROCESS_STATUS_NAMES[ProcessStatus.PROCESSING],
        eventType,
        data: (rawMessage.data ?? rawMessage) as T,
        hasFinished: false,
        doneChat,
        raw: rawMessage,
      };
    }

    // 4. Finished: completed response
    return {
      processStatus: ProcessStatus.FINISHED,
      statusName: PROCESS_STATUS_NAMES[ProcessStatus.FINISHED],
      eventType,
      data: (rawMessage.data ??
        rawMessage.response ??
        rawMessage.papers ??
        rawMessage) as T,
      hasFinished: true,
      doneChat: doneChat ?? true,
      raw: rawMessage,
    };
  }

  async syncJobStatus(
    jobId: string,
    normalized: NormalizedAiResponse,
    customResult?: unknown,
  ): Promise<void> {
    if (!this.prisma) {
      this.logger.debug(
        `PrismaService not injected, skipping job sync for [${jobId}]`,
      );
      return;
    }

    try {
      const jobStatus = toJobStatus(normalized.processStatus);
      await this.prisma.job.update({
        where: { id: jobId },
        data: {
          status: jobStatus,
          errorCode: normalized.errorCode ? String(normalized.errorCode) : null,
          errorMessage: normalized.errorMessage || null,
          result: (customResult ?? normalized.data ?? null) as any,
        },
      });
      this.logger.debug(
        `Synced job [${jobId}] to status [${jobStatus}] (ProcessStatus: ${normalized.processStatus})`,
      );
    } catch (error) {
      this.logger.warn(
        `Failed to sync job [${jobId}] to DB: ${(error as Error).message}`,
      );
    }
  }
}
