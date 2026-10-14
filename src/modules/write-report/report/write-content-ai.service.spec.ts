import { jest } from '@jest/globals';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { JobStatus } from '@prisma/client';
import { Subject } from 'rxjs';
import { PrismaService } from '../../../database/prisma.service';
import { KafkaProducerService } from '../../../messaging/kafka-producer.service';
import { RequestCorrelationService } from '../../../messaging/request-correlation.service';
import { StreamingManagerService } from '../../../common/streaming/streaming-manager.service';
import { WriteContentAiService } from './write-content-ai.service';
import { WriteContentRequestDto } from './dto/write-content-request.dto';

describe('WriteContentAiService', () => {
  let service: WriteContentAiService;
  let mockPrisma: any;
  let mockKafkaProducer: any;
  let mockCorrelation: any;
  let mockStreamingManager: any;
  let streamSubject: Subject<any>;

  const userId = '00000000-0000-0000-0000-000000000001';
  const documentId = '00000000-0000-0000-0000-000000000002';

  const validDto: WriteContentRequestDto = {
    documentId,
    field: 'Khoa học máy tính',
    domain: 'Trí tuệ nhân tạo',
    referencesStyle: 'APA',
    finalProposal: { title: 'AI in Healthcare', problemStatement: 'Issues' },
    papersSearch: [{ title: 'Paper 1' }],
    outline: { sections: ['Mở đầu', 'Nội dung'] },
    outlineCode: 'chapter_1',
    modelId: 'localhost',
    language: 'vi',
  };

  beforeEach(async () => {
    streamSubject = new Subject();

    mockPrisma = {
      document: { findUnique: jest.fn<any>() },
      job: {
        create: jest.fn<any>().mockResolvedValue({ id: 'job-wc-1' }),
        update: jest.fn<any>().mockResolvedValue({}),
      },
      report: { upsert: jest.fn<any>().mockResolvedValue({}) },
    };

    mockKafkaProducer = {
      publish: jest.fn<any>().mockResolvedValue(undefined),
    };

    mockCorrelation = {
      buildCorrelationKey: jest.fn<any>().mockReturnValue('corr-key-wc'),
      getStreamObservable: jest
        .fn<any>()
        .mockReturnValue(streamSubject.asObservable()),
      registerPending: jest.fn<any>(),
      clearPending: jest.fn<any>(),
    };

    mockStreamingManager = {
      buildStreamKey: jest.fn<any>().mockReturnValue('stream-key-wc'),
      createStream: jest.fn<any>().mockReturnValue('mock-sse-stream'),
      completeStream: jest.fn<any>(),
      destroyStream: jest.fn<any>(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WriteContentAiService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: KafkaProducerService, useValue: mockKafkaProducer },
        { provide: RequestCorrelationService, useValue: mockCorrelation },
        { provide: StreamingManagerService, useValue: mockStreamingManager },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn<any>().mockReturnValue('write_section_request_local'),
          },
        },
      ],
    }).compile();

    service = module.get<WriteContentAiService>(WriteContentAiService);
  });

  describe('startWriteContent', () => {
    it('should throw NotFoundException if document does not exist or belong to user', async () => {
      mockPrisma.document.findUnique.mockResolvedValue(null);

      await expect(service.startWriteContent(userId, validDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should publish to Kafka and process section chunks successfully', async () => {
      mockPrisma.document.findUnique.mockResolvedValue({ id: documentId });
      const pendingPromise = new Promise(() => {}); // long-running
      mockCorrelation.registerPending.mockReturnValue(pendingPromise);

      const res = await service.startWriteContent(userId, validDto);
      expect(res.status).toBe('started');
      expect(res.jobId).toBe('job-wc-1');
      expect(mockKafkaProducer.publish).toHaveBeenCalledWith(
        'write_section_request_local',
        expect.objectContaining({
          event_type: 'write_content',
          document_id: documentId,
        }),
      );

      // Phát chunk 1 (section)
      streamSubject.next({
        section: { name: 'Chương 1', content: 'Nội dung mở đầu' },
      });
      await new Promise((r) => setTimeout(r, 10));

      expect(mockPrisma.report.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { documentId },
          update: { contentMarkdown: '## Chương 1\n\nNội dung mở đầu' },
        }),
      );

      // Phát chunk 2 hoàn tất (has_finished)
      streamSubject.next({
        has_finished: true,
        section: { name: 'Chương 2', content: 'Nội dung kết' },
      });
      await new Promise((r) => setTimeout(r, 10));

      expect(mockPrisma.job.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'job-wc-1' },
          data: expect.objectContaining({ status: JobStatus.finished }),
        }),
      );
      expect(mockStreamingManager.completeStream).toHaveBeenCalledWith(
        'stream-key-wc',
      );
    });

    it('should throw BadRequestException with code 630 if Kafka publish fails', async () => {
      mockPrisma.document.findUnique.mockResolvedValue({ id: documentId });
      mockKafkaProducer.publish.mockRejectedValue(
        new Error('Broker unreachable'),
      );

      await expect(service.startWriteContent(userId, validDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockCorrelation.clearPending).toHaveBeenCalled();
    });

    it('should handle stream error by updating job status and destroying stream', async () => {
      mockPrisma.document.findUnique.mockResolvedValue({ id: documentId });
      const pendingPromise = new Promise(() => {});
      mockCorrelation.registerPending.mockReturnValue(pendingPromise);

      await service.startWriteContent(userId, validDto);

      streamSubject.error(new Error('Stream broke'));
      await new Promise((r) => setTimeout(r, 10));

      expect(mockPrisma.job.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'job-wc-1' },
          data: expect.objectContaining({
            status: JobStatus.error,
            errorCode: '630',
          }),
        }),
      );
      expect(mockStreamingManager.destroyStream).toHaveBeenCalledWith(
        'stream-key-wc',
      );
    });

    it('should handle pending promise timeout/rejection', async () => {
      mockPrisma.document.findUnique.mockResolvedValue({ id: documentId });
      const pendingPromise = Promise.reject({
        error_code: 604,
        error: 'Timed out 1500s',
      });
      mockCorrelation.registerPending.mockReturnValue(pendingPromise);

      await service.startWriteContent(userId, validDto);
      await new Promise((r) => setTimeout(r, 20));

      expect(mockPrisma.job.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'job-wc-1' },
          data: expect.objectContaining({
            status: JobStatus.error,
            errorCode: '604',
          }),
        }),
      );
      expect(mockStreamingManager.destroyStream).toHaveBeenCalledWith(
        'stream-key-wc',
      );
    });
  });

  describe('getWriteStream', () => {
    it('should return stream from streamingManager when document is owned', async () => {
      mockPrisma.document.findUnique.mockResolvedValue({ id: documentId });

      const stream = await service.getWriteStream(userId, documentId);
      expect(stream).toBe('mock-sse-stream');
      expect(mockStreamingManager.createStream).toHaveBeenCalledWith(
        'stream-key-wc',
        1500000,
      );
    });

    it('should throw NotFoundException if document is not found', async () => {
      mockPrisma.document.findUnique.mockResolvedValue(null);

      await expect(service.getWriteStream(userId, documentId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
