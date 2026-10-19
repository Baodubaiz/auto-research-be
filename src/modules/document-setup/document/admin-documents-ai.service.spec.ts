import { jest } from '@jest/globals';
import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { KafkaProducerService } from '../../../messaging/kafka-producer.service';
import { RequestCorrelationService } from '../../../messaging/request-correlation.service';
import { AdminDocumentsAiService } from './admin-documents-ai.service';

describe('AdminDocumentsAiService', () => {
  let service: AdminDocumentsAiService;
  let correlation: RequestCorrelationService;
  let publish: ReturnType<
    typeof jest.fn<
      (topic: string, payload: Record<string, unknown>) => Promise<void>
    >
  >;
  let config: ConfigService;
  const response = { success: true };

  function keyFor(payload: Record<string, unknown>) {
    return correlation.buildCorrelationKey({
      userId: String(payload.user_id),
      documentId: String(payload.document_id),
      sessionId: String(payload.session_id),
      eventType: String(payload.event_type),
    });
  }

  beforeEach(() => {
    correlation = new RequestCorrelationService();
    config = new ConfigService();
    publish = jest
      .fn<(topic: string, payload: Record<string, unknown>) => Promise<void>>()
      .mockImplementation(async (_topic, payload) => {
        correlation.dispatchResponse(keyFor(payload), response);
      });
    service = new AdminDocumentsAiService(
      { publish } as unknown as KafkaProducerService,
      correlation,
      config,
    );
  });

  it('publishes a sample document with defaults and returns its AI response', async () => {
    await expect(
      service.uploadSampleDocument('user-1', {
        title: 'Sample',
        fileUrl: 'https://example.com/sample.pdf',
      }),
    ).resolves.toEqual(response);
    expect(publish).toHaveBeenCalledWith('document_setup_request_local', {
      event_type: 'admin_documents',
      model_id: 'localhost',
      user_id: 'user-1',
      document_id: 'admin-doc',
      session_id: expect.any(String),
      language: 'vi',
      title: 'Sample',
      file_url: 'https://example.com/sample.pdf',
      field: 'General',
      document_type: 'research_paper',
    });
  });

  it('preserves sample options and uses the configured topic', async () => {
    jest.spyOn(config, 'get').mockReturnValue('custom-topic');
    await service.uploadSampleDocument('user-1', {
      title: 'Thesis',
      fileUrl: 'https://example.com/thesis.pdf',
      language: 'en',
      field: 'Computer Science',
      documentType: 'thesis',
    });
    expect(publish).toHaveBeenCalledWith(
      'custom-topic',
      expect.objectContaining({
        language: 'en',
        field: 'Computer Science',
        document_type: 'thesis',
      }),
    );
  });

  it('publishes a user guide with the default version', async () => {
    await expect(
      service.uploadUserGuide('user-1', {
        title: 'Guide',
        guideType: 'faq',
        content: 'Instructions',
      }),
    ).resolves.toEqual(response);
    expect(publish).toHaveBeenCalledWith(
      'document_setup_request_local',
      expect.objectContaining({
        event_type: 'user_guide_documents',
        user_id: 'user-1',
        document_id: 'admin-guide',
        session_id: expect.any(String),
        title: 'Guide',
        guide_type: 'faq',
        content: 'Instructions',
        version: 'v1.0',
      }),
    );
  });

  it('publishes journal filters', async () => {
    await expect(
      service.getJournals('user-1', {
        field: 'Computer Science',
        ranking: 'Q1',
        query: 'AI',
      }),
    ).resolves.toEqual(response);
    expect(publish).toHaveBeenCalledWith(
      'document_setup_request_local',
      expect.objectContaining({
        event_type: 'get_journals',
        user_id: 'user-1',
        document_id: 'admin-journals',
        session_id: expect.any(String),
        field: 'Computer Science',
        ranking: 'Q1',
        query: 'AI',
      }),
    );
  });

  it.each([618, 619])(
    'converts rejected AI error %i into HTTP 400',
    async (code) => {
      publish.mockImplementation(async (_topic, payload) => {
        correlation.dispatchResponse(keyFor(payload), {
          error_code: code,
          error: 'AI processing failed',
        });
      });
      const request =
        code === 618
          ? service.uploadSampleDocument('user-1', {
              title: 'Sample',
              fileUrl: 'file.pdf',
            })
          : service.uploadUserGuide('user-1', {
              title: 'Guide',
              guideType: 'faq',
              content: 'Text',
            });
      await expect(request).rejects.toMatchObject({
        response: {
          statusCode: 400,
          errorCode: code,
          message: 'AI processing failed',
        },
      });
    },
  );

  it('handles an error returned as a resolved response', async () => {
    publish.mockImplementation(async (_topic, payload) => {
      correlation.resolvePending(keyFor(payload), { error_code: 618 });
    });
    await expect(
      service.uploadSampleDocument('user-1', {
        title: 'Sample',
        fileUrl: 'file.pdf',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('clears the pending request when Kafka publish fails', async () => {
    let failedKey = '';
    publish.mockImplementation(async (_topic, payload) => {
      failedKey = keyFor(payload);
      throw new Error('Broker unavailable');
    });
    await expect(service.getJournals('user-1', {})).rejects.toMatchObject({
      response: { statusCode: 400, errorCode: 600 },
    });
    expect(correlation.hasPending(failedKey)).toBe(false);
  });

  it('converts correlation timeouts into an HTTP error', async () => {
    jest.useFakeTimers();
    try {
      publish.mockResolvedValue(undefined);
      const request = service.getJournals('user-1', {});
      const assertion = expect(request).rejects.toMatchObject({
        response: { statusCode: 400, errorCode: 600 },
      });
      await jest.advanceTimersByTimeAsync(120000);
      await assertion;
      expect(jest.getTimerCount()).toBe(0);
    } finally {
      jest.useRealTimers();
    }
  });
});
