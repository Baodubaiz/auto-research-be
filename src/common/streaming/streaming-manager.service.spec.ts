import { jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { MessageEvent } from '@nestjs/common';
import { StreamingManagerService } from './streaming-manager.service';
import { AiStatusMapperService } from '../services/ai-status-mapper.service';
import { ProcessStatus } from '../enums/process-status.enum';
import { isStreamingEventType } from './dto/stream-event.dto';

describe('StreamingManagerService', () => {
  let service: StreamingManagerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StreamingManagerService, AiStatusMapperService],
    }).compile();

    service = module.get<StreamingManagerService>(StreamingManagerService);
  });

  afterEach(() => {
    // Clean up any remaining timers/streams
    for (let i = 0; i < 5; i++) {
      service.destroyStream(`key-${i}`);
    }
  });

  describe('buildStreamKey', () => {
    it('should generate standard 4-part correlation stream key', () => {
      const key1 = service.buildStreamKey({
        userId: 'user-1',
        documentId: 'doc-123',
        sessionId: 'sess-456',
        eventType: 'write_content',
      });
      expect(key1).toBe('user-1:doc-123:sess-456:write_content');

      const key2 = service.buildStreamKey({
        userId: 'user-2',
        convId: 'conv-789',
        eventType: 'writer',
      });
      expect(key2).toBe('user-2:conv-789:default:writer');
    });
  });

  describe('createStream & emitChunk', () => {
    it('should emit chunks and complete when has_finished is true', async () => {
      const streamKey = 'user-1:doc-1:sess-1:write_content';
      const stream$ = service.createStream(streamKey);
      expect(service.hasStream(streamKey)).toBe(true);
      expect(service.getActiveStreamCount()).toBe(1);

      const receivedEvents: MessageEvent[] = [];
      const sub = stream$.subscribe({
        next: (ev) => receivedEvents.push(ev),
      });

      // 1. Emit chunk 1 (processing)
      const emitted1 = service.emitChunk(streamKey, {
        event_type: 'write_content',
        has_finished: false,
        chunk: 'Chapter 1: Overview',
      });
      expect(emitted1).toBe(true);

      // 2. Emit chunk 2 (finished)
      const emitted2 = service.emitChunk(streamKey, {
        event_type: 'write_content',
        has_finished: true,
        data: { text: 'Full report generated' },
      });
      expect(emitted2).toBe(true);

      expect(receivedEvents.length).toBe(2);
      expect((receivedEvents[0].data as any).processStatus).toBe(
        ProcessStatus.PROCESSING,
      );
      expect((receivedEvents[0].data as any).chunk).toBe('Chapter 1: Overview');
      expect((receivedEvents[0].data as any).hasFinished).toBe(false);

      expect(receivedEvents[1].type).toBe('complete');
      expect((receivedEvents[1].data as any).processStatus).toBe(
        ProcessStatus.FINISHED,
      );
      expect((receivedEvents[1].data as any).hasFinished).toBe(true);

      // Stream should be closed and removed after completion
      expect(service.hasStream(streamKey)).toBe(false);
      sub.unsubscribe();
    });

    it('should return false when emitting to non-existent stream key', () => {
      const result = service.emitChunk('unknown-key', {
        chunk: 'data',
      });
      expect(result).toBe(false);
    });
  });

  describe('Error handling in streams', () => {
    it('should emit error SSE event and complete stream on AI error code', async () => {
      const streamKey = 'user-1:doc-1:sess-1:write_content';
      const stream$ = service.createStream(streamKey);

      const receivedEvents: MessageEvent[] = [];
      const sub = stream$.subscribe((ev) => receivedEvents.push(ev));

      service.emitChunk(streamKey, {
        event_type: 'write_content',
        error_code: 630,
        error: 'Out of context tokens',
      });

      expect(receivedEvents.length).toBe(1);
      expect(receivedEvents[0].type).toBe('error');
      expect((receivedEvents[0].data as any).processStatus).toBe(
        ProcessStatus.ERROR,
      );
      expect((receivedEvents[0].data as any).errorCode).toBe(630);
      expect((receivedEvents[0].data as any).errorMessage).toContain(
        'Lỗi khi soạn thảo nội dung báo cáo nghiên cứu.',
      );
      expect((receivedEvents[0].data as any).hasFinished).toBe(false);

      // Automatically closed on error
      expect(service.hasStream(streamKey)).toBe(false);
      sub.unsubscribe();
    });

    it('should emit error and close when errorStream is called directly', async () => {
      const streamKey = 'user-2:doc-2:sess-2:gen_slides';
      const stream$ = service.createStream(streamKey);

      const receivedEvents: MessageEvent[] = [];
      stream$.subscribe((ev) => receivedEvents.push(ev));

      service.errorStream(streamKey, new Error('Network failure'));

      expect(receivedEvents.length).toBe(1);
      expect(receivedEvents[0].type).toBe('error');
      expect((receivedEvents[0].data as any).errorMessage).toBe(
        'Network failure',
      );
      expect(service.hasStream(streamKey)).toBe(false);
    });
  });

  describe('Auto-cleanup and Lifecycle', () => {
    it('should cleanup Subject when subscriber unsubscribes (client disconnect)', () => {
      const streamKey = 'user-3:doc-3:sess-3:writer';
      const stream$ = service.createStream(streamKey);

      expect(service.hasStream(streamKey)).toBe(true);
      const sub = stream$.subscribe();

      // Client disconnects
      sub.unsubscribe();

      expect(service.hasStream(streamKey)).toBe(false);
      expect(service.getActiveStreamCount()).toBe(0);
    });

    it('should destroy previous stream if same key is recreated', () => {
      const streamKey = 'user-4:doc-4:sess-4:chuyen_de_1';
      service.createStream(streamKey);
      expect(service.getActiveStreamCount()).toBe(1);

      service.createStream(streamKey);
      expect(service.getActiveStreamCount()).toBe(1);
      service.destroyStream(streamKey);
      expect(service.getActiveStreamCount()).toBe(0);
    });

    it('should operate with fallbackNormalize when AiStatusMapperService is not provided', () => {
      const standaloneService = new StreamingManagerService(undefined);
      const streamKey = 'standalone-key';
      const stream$ = standaloneService.createStream(streamKey);

      const events: MessageEvent[] = [];
      stream$.subscribe((ev) => events.push(ev));

      standaloneService.emitChunk(streamKey, {
        has_finished: false,
        chunk: 'test fallback chunk',
      });

      standaloneService.emitChunk(streamKey, {
        has_finished: true,
        data: 'done',
      });

      expect(events.length).toBe(2);
      expect((events[0].data as any).processStatus).toBe(
        ProcessStatus.PROCESSING,
      );
      expect((events[1].data as any).processStatus).toBe(
        ProcessStatus.FINISHED,
      );
    });

    it('should match fallback stream key when sessionId is default', () => {
      const streamKey = 'user-5:doc-5:default:write_content';
      service.createStream(streamKey);

      const matched = service.emitChunk(
        'user-5:doc-5:sess-diff:write_content',
        { has_finished: true },
      );
      expect(matched).toBe(true);
    });

    it('should complete stream when idle timeout fires', () => {
      jest.useFakeTimers();
      const streamKey = 'user-6:doc-6:sess-6:writer';
      service.createStream(streamKey, 1000);

      expect(service.hasStream(streamKey)).toBe(true);
      jest.advanceTimersByTime(1500);

      expect(service.hasStream(streamKey)).toBe(false);
      jest.useRealTimers();
    });
  });

  describe('isStreamingEventType utility', () => {
    it('should identify streaming events correctly', () => {
      expect(isStreamingEventType('write_content')).toBe(true);
      expect(isStreamingEventType('gen_slides')).toBe(true);
      expect(isStreamingEventType('chuyen_de_1')).toBe(true);
      expect(isStreamingEventType('writer')).toBe(true);
      expect(isStreamingEventType('search_papers')).toBe(false);
      expect(isStreamingEventType('unknown_event')).toBe(false);
    });
  });
});
