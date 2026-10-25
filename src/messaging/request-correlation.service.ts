import { Injectable, Logger, Optional } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';
import { StreamingManagerService } from '../common/streaming/streaming-manager.service';
import { TimeoutManagerService } from '../common/services/timeout-manager.service';

export interface CorrelationKeyParams {
  userId: string;
  documentId?: string;
  convId?: string;
  sessionId?: string;
  eventType: string;
}

export interface PendingRequest<T = unknown> {
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
  timer: NodeJS.Timeout;
  createdAt: number;
}

@Injectable()
export class RequestCorrelationService {
  private readonly logger = new Logger(RequestCorrelationService.name);

  private readonly pendingRequests = new Map<string, PendingRequest>();
  private readonly streamSubjects = new Map<string, Subject<unknown>>();

  constructor(
    @Optional() private readonly streamingManager?: StreamingManagerService,
    @Optional() private readonly timeoutManager?: TimeoutManagerService,
  ) {}

  buildCorrelationKey(params: CorrelationKeyParams): string {
    const targetId = params.convId || params.documentId || 'none';
    const session = params.sessionId || 'default';
    return `${params.userId}:${targetId}:${session}:${params.eventType}`;
  }

  registerPending<T = unknown>(
    key: string,
    timeoutMs?: number,
    eventType?: string,
    jobId?: string,
  ): Promise<T> {
    if (this.pendingRequests.has(key)) {
      this.clearPending(key);
    }

    const duration =
      timeoutMs ??
      (this.timeoutManager
        ? this.timeoutManager.getTimeoutForEvent(eventType)
        : 120000);

    return new Promise<T>((resolve, reject) => {
      let timer: NodeJS.Timeout;

      if (this.timeoutManager) {
        timer = this.timeoutManager.registerTimeout(
          key,
          eventType || 'default',
          (code, msg) => {
            this.pendingRequests.delete(key);
            reject({ error_code: code, error: msg });
          },
          duration,
          jobId,
        );
      } else {
        timer = setTimeout(() => {
          this.logger.warn(
            `Request correlation timeout for key [${key}] after ${duration}ms`,
          );
          this.pendingRequests.delete(key);
          reject(new Error(`Request timed out for [${key}]`));
        }, duration);
      }

      this.pendingRequests.set(key, {
        resolve: resolve as (val: unknown) => void,
        reject,
        timer,
        createdAt: Date.now(),
      });
    });
  }

  resolvePending<T = unknown>(key: string, data: T): boolean {
    const matchedKey = this.findMatchingKey(key);
    if (!matchedKey) return false;

    const pending = this.pendingRequests.get(matchedKey);
    if (!pending) return false;

    clearTimeout(pending.timer);
    this.timeoutManager?.clearTimeout(matchedKey);
    this.pendingRequests.delete(matchedKey);
    pending.resolve(data);
    return true;
  }

  rejectPending(key: string, error: unknown): boolean {
    const matchedKey = this.findMatchingKey(key);
    if (!matchedKey) return false;

    const pending = this.pendingRequests.get(matchedKey);
    if (!pending) return false;

    clearTimeout(pending.timer);
    this.timeoutManager?.clearTimeout(matchedKey);
    this.pendingRequests.delete(matchedKey);
    pending.reject(error);
    return true;
  }

  getStreamObservable<T = unknown>(key: string): Observable<T> {
    return this.getOrCreateStreamSubject<T>(key).asObservable();
  }

  emitStreamEvent(key: string, data: unknown): void {
    const subject = this.streamSubjects.get(key);
    if (subject) {
      subject.next(data);
    }
  }

  completeStream(key: string): void {
    const subject = this.streamSubjects.get(key);
    if (subject) {
      this.streamSubjects.delete(key);
      subject.complete();
    }
  }

  errorStream(key: string, error: unknown): void {
    const subject = this.streamSubjects.get(key);
    if (subject) {
      this.streamSubjects.delete(key);
      subject.error(error);
    }
  }

  dispatchResponse(key: string, payload: Record<string, unknown>): void {
    const streamKey = this.findMatchingStreamKey(key) || key;

    if (this.streamingManager?.hasStream(streamKey)) {
      this.streamingManager.emitChunk(streamKey, payload);
    }

    if (this.streamSubjects.has(streamKey)) {
      this.emitStreamEvent(streamKey, payload);
      if (payload.has_finished === true) {
        this.completeStream(streamKey);
        this.resolvePending(streamKey, payload);
      } else if (payload.error || payload.error_code) {
        this.errorStream(streamKey, payload);
        this.rejectPending(streamKey, payload);
      }
      return;
    }

    if (payload.error || payload.error_code) {
      this.rejectPending(key, payload);
    } else {
      this.resolvePending(key, payload);
    }
  }

  hasPending(key: string): boolean {
    return this.pendingRequests.has(key);
  }

  hasStream(key: string): boolean {
    return this.streamSubjects.has(key);
  }

  clearPending(key: string, reason?: string): void {
    const pending = this.pendingRequests.get(key);
    if (pending) {
      clearTimeout(pending.timer);
      this.timeoutManager?.clearTimeout(key);
      this.pendingRequests.delete(key);
      pending.reject(
        new Error(reason || `Request [${key}] was cleared or overwritten`),
      );
    }
  }

  private getOrCreateStreamSubject<T = unknown>(key: string): Subject<T> {
    let subject = this.streamSubjects.get(key) as Subject<T> | undefined;
    if (!subject) {
      subject = new Subject<T>();
      this.streamSubjects.set(key, subject as Subject<unknown>);
    }
    return subject;
  }

  private findMatchingKey(key: string): string | undefined {
    if (this.pendingRequests.has(key)) return key;
    return this.findMatchingKeyInMap(this.pendingRequests.keys(), key);
  }

  private findMatchingStreamKey(key: string): string | undefined {
    if (this.streamSubjects.has(key)) return key;
    return this.findMatchingKeyInMap(this.streamSubjects.keys(), key);
  }

  private findMatchingKeyInMap(
    mapKeys: Iterable<string>,
    key: string,
  ): string | undefined {
    const parts = key.split(':');
    if (parts.length !== 4) return undefined;
    const [userId, targetId, , eventType] = parts;
    for (const existingKey of mapKeys) {
      if (existingKey === key) return key;
      const [exUser, exTarget, , exEvent] = existingKey.split(':');
      const isTargetMatch =
        exTarget === targetId ||
        (exTarget.replace(/-/g, '').slice(0, 24) === targetId.replace(/-/g, '').slice(0, 24));
      if (
        exUser === userId &&
        isTargetMatch &&
        exEvent === eventType
      ) {
        return existingKey;
      }
    }
    return undefined;
  }
}
