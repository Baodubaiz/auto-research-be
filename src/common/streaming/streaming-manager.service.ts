import { Injectable, Logger, Optional, MessageEvent } from '@nestjs/common';
import { Observable, Subject, finalize } from 'rxjs';
import {
  ProcessStatus,
  PROCESS_STATUS_NAMES,
} from '../enums/process-status.enum';
import { AiStatusMapperService } from '../services/ai-status-mapper.service';
import { StreamEventData } from './dto/stream-event.dto';

export interface StreamKeyParams {
  userId: string;
  targetId?: string;
  documentId?: string;
  convId?: string;
  sessionId?: string;
  eventType?: string;
}

@Injectable()
export class StreamingManagerService {
  private readonly logger = new Logger(StreamingManagerService.name);
  private readonly streams = new Map<string, Subject<MessageEvent>>();
  private readonly idleTimers = new Map<string, NodeJS.Timeout>();

  constructor(
    @Optional() private readonly aiStatusMapper?: AiStatusMapperService,
  ) {}

  buildStreamKey(params: StreamKeyParams): string {
    const target =
      params.convId || params.documentId || params.targetId || 'none';
    const session = params.sessionId || 'default';
    const event = params.eventType || 'all';
    return `${params.userId}:${target}:${session}:${event}`;
  }

  createStream(key: string, idleTimeoutMs = 300000): Observable<MessageEvent> {
    if (this.streams.has(key)) {
      this.destroyStream(key);
    }

    const subject = new Subject<MessageEvent>();
    this.streams.set(key, subject);

    const timer = setTimeout(() => {
      this.logger.warn(
        `Stream [${key}] idle timed out after ${idleTimeoutMs}ms`,
      );
      this.completeStream(key);
    }, idleTimeoutMs);
    this.idleTimers.set(key, timer);

    this.logger.debug(`Created SSE stream for key [${key}]`);

    return subject.asObservable().pipe(
      finalize(() => {
        this.cleanupStream(key);
      }),
    );
  }

  emitChunk(key: string, rawPayload: Record<string, unknown>): boolean {
    const matchedKey = this.findMatchingKey(key);
    if (!matchedKey) return false;

    const subject = this.streams.get(matchedKey);
    if (!subject) return false;

    this.refreshIdleTimer(matchedKey);

    const normalized = this.aiStatusMapper
      ? this.aiStatusMapper.normalizeResponse(rawPayload)
      : this.fallbackNormalize(rawPayload);

    const isError = normalized.processStatus === ProcessStatus.ERROR;
    const isFinished =
      normalized.processStatus === ProcessStatus.FINISHED ||
      normalized.hasFinished === true;

    const eventType = isError ? 'error' : isFinished ? 'complete' : 'message';

    const eventData: StreamEventData = {
      processStatus: normalized.processStatus,
      statusName: normalized.statusName,
      hasFinished: Boolean(normalized.hasFinished),
      eventType: normalized.eventType,
      chunk: (rawPayload.chunk !== undefined
        ? rawPayload.chunk
        : normalized.data) as any,
      data: normalized.data,
      progress:
        typeof rawPayload.progress === 'number'
          ? rawPayload.progress
          : undefined,
      errorCode: normalized.errorCode,
      errorName: normalized.errorName,
      errorMessage: normalized.errorMessage,
      raw: rawPayload,
    };

    const sseEvent: MessageEvent = {
      type: eventType,
      id: `${Date.now()}`,
      data: eventData,
    };

    subject.next(sseEvent);

    if (isFinished || isError) {
      this.completeStream(matchedKey);
    }

    return true;
  }

  completeStream(key: string): void {
    const matchedKey = this.findMatchingKey(key) || key;
    const subject = this.streams.get(matchedKey);
    if (subject) {
      this.clearIdleTimer(matchedKey);
      this.streams.delete(matchedKey);
      subject.complete();
      this.logger.debug(`Completed and cleaned up stream [${matchedKey}]`);
    }
  }

  errorStream(key: string, error: unknown): void {
    const matchedKey = this.findMatchingKey(key) || key;
    const subject = this.streams.get(matchedKey);
    if (subject) {
      const errorMsg =
        typeof error === 'string'
          ? error
          : (error as Error)?.message || 'Unknown streaming error';

      const sseEvent: MessageEvent = {
        type: 'error',
        id: `${Date.now()}`,
        data: {
          processStatus: ProcessStatus.ERROR,
          statusName: PROCESS_STATUS_NAMES[ProcessStatus.ERROR],
          hasFinished: true,
          errorMessage: errorMsg,
          raw: typeof error === 'object' ? (error as any) : undefined,
        },
      };

      subject.next(sseEvent);
      this.completeStream(matchedKey);
    }
  }

  hasStream(key: string): boolean {
    return Boolean(this.findMatchingKey(key));
  }

  getActiveStreamCount(): number {
    return this.streams.size;
  }

  destroyStream(key: string): void {
    const matchedKey = this.findMatchingKey(key) || key;
    const subject = this.streams.get(matchedKey);
    this.clearIdleTimer(matchedKey);
    this.streams.delete(matchedKey);
    if (subject) {
      subject.complete();
    }
  }

  private cleanupStream(key: string): void {
    this.clearIdleTimer(key);
    this.streams.delete(key);
    this.logger.debug(`Client disconnected/finalized stream for [${key}]`);
  }

  private clearIdleTimer(key: string): void {
    const timer = this.idleTimers.get(key);
    if (timer) {
      clearTimeout(timer);
      this.idleTimers.delete(key);
    }
  }

  private refreshIdleTimer(key: string, timeoutMs = 300000): void {
    this.clearIdleTimer(key);
    const timer = setTimeout(() => {
      this.logger.warn(`Stream [${key}] timed out on inactivity`);
      this.completeStream(key);
    }, timeoutMs);
    this.idleTimers.set(key, timer);
  }

  private findMatchingKey(key: string): string | undefined {
    if (this.streams.has(key)) return key;

    const parts = key.split(':');
    if (parts.length >= 3) {
      const [userId, targetId, session] = parts;
      for (const existingKey of this.streams.keys()) {
        const [exUser, exTarget, exSession] = existingKey.split(':');
        if (
          exUser === userId &&
          exTarget === targetId &&
          (exSession === session ||
            session === 'default' ||
            exSession === 'default')
        ) {
          return existingKey;
        }
      }
    }
    return undefined;
  }

  private fallbackNormalize(raw: Record<string, unknown>) {
    const hasFinished = raw.has_finished === true;
    const hasError = Boolean(raw.error || raw.error_code);
    const status = hasError
      ? ProcessStatus.ERROR
      : hasFinished
        ? ProcessStatus.FINISHED
        : ProcessStatus.PROCESSING;

    return {
      processStatus: status,
      statusName: PROCESS_STATUS_NAMES[status],
      hasFinished,
      eventType: raw.event_type ? String(raw.event_type) : undefined,
      errorCode: raw.error_code ? Number(raw.error_code) : undefined,
      errorName: hasError ? 'AI_ERROR' : undefined,
      errorMessage: raw.error ? String(raw.error) : undefined,
      data: raw.data ?? raw,
    };
  }
}
