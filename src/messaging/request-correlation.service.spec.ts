import { jest } from '@jest/globals';
import { RequestCorrelationService } from './request-correlation.service';

describe('RequestCorrelationService', () => {
  let service: RequestCorrelationService;

  beforeEach(() => {
    service = new RequestCorrelationService();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe('buildCorrelationKey', () => {
    it('should generate standard correlation key with documentId', () => {
      const key = service.buildCorrelationKey({
        userId: 'user-1',
        documentId: 'doc-1',
        sessionId: 'sess-1',
        eventType: 'search_papers',
      });
      expect(key).toBe('user-1:doc-1:sess-1:search_papers');
    });

    it('should prefer convId for chatbot correlation key', () => {
      const key = service.buildCorrelationKey({
        userId: 'user-1',
        convId: 'conv-99',
        documentId: 'doc-1',
        sessionId: 'sess-1',
        eventType: 'outer_chatbot',
      });
      expect(key).toBe('user-1:conv-99:sess-1:outer_chatbot');
    });

    it('should use default values when optional fields are absent', () => {
      const key = service.buildCorrelationKey({
        userId: 'user-1',
        eventType: 'generate_domains',
      });
      expect(key).toBe('user-1:none:default:generate_domains');
    });
  });

  describe('Pending Request Lifecycle', () => {
    it('should register and resolve pending request successfully', async () => {
      const key = 'user-1:doc-1:sess-1:search_papers';
      const promise = service.registerPending(key, 5000);

      expect(service.hasPending(key)).toBe(true);

      const resolved = service.resolvePending(key, { result: 'papers_found' });
      expect(resolved).toBe(true);
      expect(service.hasPending(key)).toBe(false);

      const result = await promise;
      expect(result).toEqual({ result: 'papers_found' });
    });

    it('should register and reject pending request successfully', async () => {
      const key = 'user-1:doc-1:sess-1:search_papers';
      const promise = service.registerPending(key, 5000);

      const rejected = service.rejectPending(key, new Error('Kafka error'));
      expect(rejected).toBe(true);

      await expect(promise).rejects.toThrow('Kafka error');
      expect(service.hasPending(key)).toBe(false);
    });

    it('should return false when resolving non-existent key', () => {
      expect(service.resolvePending('non:existent:key', {})).toBe(false);
      expect(service.rejectPending('non:existent:key', {})).toBe(false);
    });

    it('should handle timeout when no response arrives', async () => {
      jest.useFakeTimers();
      const key = 'user-1:doc-1:sess-1:search_papers';
      const promise = service.registerPending(key, 2000);

      jest.advanceTimersByTime(2001);

      await expect(promise).rejects.toThrow('Request timed out');
      expect(service.hasPending(key)).toBe(false);
      jest.useRealTimers();
    });

    it('should clear old pending request when re-registering same key', async () => {
      const key = 'user-1:doc-1:sess-1:event';
      const firstPromise = service.registerPending(key, 5000);
      const secondPromise = service.registerPending(key, 5000);

      await expect(firstPromise).rejects.toThrow('cleared or overwritten');

      service.resolvePending(key, { data: 'second' });
      await expect(secondPromise).resolves.toEqual({ data: 'second' });
    });

    it('should resolve via fallback key when sessionId differs in AI response', async () => {
      const registeredKey = 'user-1:doc-1:sess-original:search_papers';
      const promise = service.registerPending(registeredKey, 5000);

      // AI response arrived with different session_id or fallback
      const arrivedKey = 'user-1:doc-1:sess-modified:search_papers';
      const resolved = service.resolvePending(arrivedKey, { success: true });

      expect(resolved).toBe(true);
      const result = await promise;
      expect(result).toEqual({ success: true });
    });
  });

  describe('Streaming RxJS Support', () => {
    it('should emit multiple chunks through stream subject and complete', (done) => {
      const key = 'user-1:doc-1:sess-1:write_content';
      const chunks: unknown[] = [];

      service.getStreamObservable(key).subscribe({
        next: (chunk) => chunks.push(chunk),
        complete: () => {
          expect(chunks).toEqual([{ part: 1 }, { part: 2 }]);
          expect(service.hasStream(key)).toBe(false);
          done();
        },
      });

      expect(service.hasStream(key)).toBe(true);
      service.emitStreamEvent(key, { part: 1 });
      service.emitStreamEvent(key, { part: 2 });
      service.completeStream(key);
    });

    it('should propagate stream errors', (done) => {
      const key = 'user-1:doc-1:sess-1:stream_err';

      service.getStreamObservable(key).subscribe({
        error: (err: unknown) => {
          expect((err as Error).message).toBe('Stream failed');
          expect(service.hasStream(key)).toBe(false);
          done();
        },
      });

      service.errorStream(key, new Error('Stream failed'));
    });
  });

  describe('dispatchResponse', () => {
    it('should dispatch regular response to pending promise', async () => {
      const key = 'user-1:doc-1:sess-1:event';
      const promise = service.registerPending(key);

      service.dispatchResponse(key, {
        event_type: 'event',
        status: 'finished',
      });

      const res = await promise;
      expect(res).toEqual({ event_type: 'event', status: 'finished' });
    });

    it('should dispatch error response to pending promise', async () => {
      const key = 'user-1:doc-1:sess-1:event';
      const promise = service.registerPending(key);

      service.dispatchResponse(key, {
        event_type: 'event',
        error_code: 610,
        error: 'SEARCH_PAPERS_FAILED',
      });

      await expect(promise).rejects.toEqual({
        event_type: 'event',
        error_code: 610,
        error: 'SEARCH_PAPERS_FAILED',
      });
    });

    it('should dispatch streaming chunk and complete when has_finished is true', async () => {
      const key = 'user-1:doc-1:sess-1:write_content';
      const promise = service.registerPending(key);
      const chunks: unknown[] = [];

      service.getStreamObservable(key).subscribe({
        next: (chunk) => chunks.push(chunk),
      });

      service.dispatchResponse(key, { section: 1, has_finished: false });
      service.dispatchResponse(key, { section: 2, has_finished: true });

      expect(chunks.length).toBe(2);
      const finalRes = await promise;
      expect(finalRes).toEqual({ section: 2, has_finished: true });
    });
  });

  describe('Multi-Tenancy Isolation', () => {
    it('should isolate concurrent requests from different users', async () => {
      const keyUserA = 'user-A:doc-1:sess-1:search_papers';
      const keyUserB = 'user-B:doc-1:sess-1:search_papers';

      const promiseA = service.registerPending(keyUserA);
      const promiseB = service.registerPending(keyUserB);

      service.resolvePending(keyUserA, { data: 'A_DATA' });
      service.resolvePending(keyUserB, { data: 'B_DATA' });

      const [resA, resB] = await Promise.all([promiseA, promiseB]);
      expect(resA).toEqual({ data: 'A_DATA' });
      expect(resB).toEqual({ data: 'B_DATA' });
    });
  });
});
