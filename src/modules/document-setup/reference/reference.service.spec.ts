import { jest } from '@jest/globals';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { JobStatus, ModuleType } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { KafkaProducerService } from '../../../messaging/kafka-producer.service';
import { RequestCorrelationService } from '../../../messaging/request-correlation.service';
import { ReferenceService } from './reference.service';
import { SearchPapersDto } from './dto/search-papers.dto';
import { CreateReferenceDto } from './dto/create-reference.dto';
import { UpdateReferenceDto } from './dto/update-reference.dto';

describe('ReferenceService', () => {
  let service: ReferenceService;
  let mockPrisma: Record<string, any>;
  let mockKafkaProducer: Record<string, any>;
  let mockCorrelationService: Record<string, any>;
  let mockConfigService: Record<string, any>;

  const userId = '00000000-0000-0000-0000-000000000001';
  const documentId = '00000000-0000-0000-0000-000000000002';

  const sampleSearchDto: SearchPapersDto = {
    documentId,
    field: 'Computer Science',
    domain: 'Artificial Intelligence',
    subdomains: ['Machine Learning'],
    query: 'AI in Higher Education',
    countryFilter: 'both',
    oaFilter: true,
    isOa: true,
    isTool: false,
    downloadedPapers: [],
    cutOffYearLow: 2020,
    cutOffYearHigh: 2026,
    searchRange: 'all',
    useWebSearch: false,
    modelId: 'localhost',
    language: 'vi',
  };

  beforeEach(async () => {
    mockPrisma = {
      reference: {
        create: jest.fn<any>(),
        findMany: jest.fn<any>(),
        findUnique: jest.fn<any>(),
        update: jest.fn<any>(),
        delete: jest.fn<any>(),
      },
      document: {
        findFirst: jest.fn<any>(),
      },
      job: {
        create: jest.fn<any>(),
        update: jest.fn<any>(),
      },
    };

    mockKafkaProducer = {
      publish: jest.fn<any>().mockResolvedValue(undefined),
    };

    mockCorrelationService = {
      buildCorrelationKey: jest
        .fn<any>()
        .mockReturnValue(`${userId}:${documentId}:sess-123:search_papers`),
      registerPending: jest.fn<any>(),
      clearPending: jest.fn<any>(),
    };

    mockConfigService = {
      get: jest.fn<any>((key: string) => {
        if (key === 'kafka.topics.document_setup.request') {
          return 'document_setup_request_local';
        }
        return undefined;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReferenceService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: KafkaProducerService, useValue: mockKafkaProducer },
        {
          provide: RequestCorrelationService,
          useValue: mockCorrelationService,
        },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<ReferenceService>(ReferenceService);
  });

  describe('CRUD Operations', () => {
    it('should create a reference successfully', async () => {
      const dto: CreateReferenceDto = { title: 'Test Paper', year: 2023 };
      const created = { id: 'ref-1', ...dto };
      mockPrisma.reference.create.mockResolvedValue(created);

      const result = await service.create(dto);
      expect(result).toEqual(created);
      expect(mockPrisma.reference.create).toHaveBeenCalledWith({ data: dto });
    });

    it('should find all references', async () => {
      const list = [{ id: 'ref-1', title: 'Paper 1' }];
      mockPrisma.reference.findMany.mockResolvedValue(list);

      const result = await service.findAll();
      expect(result).toEqual(list);
    });

    it('should find one reference by id', async () => {
      const ref = { id: 'ref-1', title: 'Paper 1' };
      mockPrisma.reference.findUnique.mockResolvedValue(ref);

      const result = await service.findOne('ref-1');
      expect(result).toEqual(ref);
    });

    it('should throw NotFoundException if reference not found', async () => {
      mockPrisma.reference.findUnique.mockResolvedValue(null);
      await expect(service.findOne('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should update reference successfully', async () => {
      const ref = { id: 'ref-1', title: 'Old Title' };
      const dto: UpdateReferenceDto = { title: 'New Title' };
      mockPrisma.reference.findUnique.mockResolvedValue(ref);
      mockPrisma.reference.update.mockResolvedValue({ id: 'ref-1', ...dto });

      const result = await service.update('ref-1', dto);
      expect(result.title).toBe('New Title');
    });

    it('should remove reference successfully', async () => {
      const ref = { id: 'ref-1', title: 'Paper 1' };
      mockPrisma.reference.findUnique.mockResolvedValue(ref);
      mockPrisma.reference.delete.mockResolvedValue(ref);

      const result = await service.remove('ref-1');
      expect(result).toEqual({ message: 'Reference deleted successfully' });
    });
  });

  describe('searchPapers', () => {
    it('should throw NotFoundException if document does not belong to user', async () => {
      mockPrisma.document.findFirst.mockResolvedValue(null);

      await expect(
        service.searchPapers(userId, sampleSearchDto),
      ).rejects.toThrow(NotFoundException);

      expect(mockPrisma.job.create).not.toHaveBeenCalled();
    });

    it('should publish to Kafka and return papers on successful response', async () => {
      mockPrisma.document.findFirst.mockResolvedValue({ id: documentId });
      const mockJob = {
        id: 'job-uuid-1',
        module: ModuleType.document_setup,
        action: 'search_papers',
        status: JobStatus.pending,
      };
      mockPrisma.job.create.mockResolvedValue(mockJob);
      mockPrisma.job.update.mockResolvedValue(mockJob);

      const mockAiResponse = {
        event_type: 'search_papers',
        session_id: 'sess-123',
        papers: [
          {
            title: 'Deep Learning in Education',
            user_language_title: 'Học sâu trong Giáo dục',
            year: 2024,
            authors: 'Le, V. A.',
            journal: 'Computers & Education',
            q: 'Q1',
            url: 'https://example.com/paper1',
            open_access: true,
            status: 'downloaded',
            citation: 42,
          },
        ],
      };

      mockCorrelationService.registerPending.mockResolvedValue(mockAiResponse);

      const result = await service.searchPapers(userId, sampleSearchDto);

      expect(result).toBeDefined();
      expect(result.jobId).toBe('job-uuid-1');
      expect(result.papers).toHaveLength(1);
      expect(result.papers[0].title).toBe('Deep Learning in Education');
      expect(result.total).toBe(1);

      expect(mockKafkaProducer.publish).toHaveBeenCalledWith(
        'document_setup_request_local',
        expect.objectContaining({
          event_type: 'search_papers',
          model_id: 'localhost',
          user_id: userId,
          document_id: documentId,
          language: 'vi',
          field: 'Computer Science',
          query: 'AI in Higher Education',
        }),
      );

      expect(mockPrisma.job.update).toHaveBeenCalledWith({
        where: { id: 'job-uuid-1' },
        data: { status: JobStatus.processing },
      });

      expect(mockPrisma.job.update).toHaveBeenCalledWith({
        where: { id: 'job-uuid-1' },
        data: {
          status: JobStatus.finished,
          result: {
            papers: mockAiResponse.papers,
            total: 1,
          },
        },
      });
    });

    it('should handle alternative "data" field in AI response', async () => {
      mockPrisma.document.findFirst.mockResolvedValue({ id: documentId });
      mockPrisma.job.create.mockResolvedValue({ id: 'job-uuid-2' });
      mockPrisma.job.update.mockResolvedValue({});

      mockCorrelationService.registerPending.mockResolvedValue({
        data: [{ title: 'Paper via Data' }],
      });

      const result = await service.searchPapers(userId, sampleSearchDto);
      expect(result.papers).toHaveLength(1);
      expect(result.papers[0].title).toBe('Paper via Data');
    });

    it('should handle Kafka publish error, clear pending, update job, and throw error 610', async () => {
      mockPrisma.document.findFirst.mockResolvedValue({ id: documentId });
      mockPrisma.job.create.mockResolvedValue({ id: 'job-uuid-3' });
      mockPrisma.job.update.mockResolvedValue({});

      mockKafkaProducer.publish.mockRejectedValue(
        new Error('Broker unreachable'),
      );

      await expect(
        service.searchPapers(userId, sampleSearchDto),
      ).rejects.toThrow(BadRequestException);

      expect(mockCorrelationService.clearPending).toHaveBeenCalled();
      expect(mockPrisma.job.update).toHaveBeenCalledWith({
        where: { id: 'job-uuid-3' },
        data: expect.objectContaining({
          status: JobStatus.error,
          errorCode: '610',
        }),
      });
    });

    it('should handle AI error 610 returned from AI Engine and update job status', async () => {
      mockPrisma.document.findFirst.mockResolvedValue({ id: documentId });
      mockPrisma.job.create.mockResolvedValue({ id: 'job-uuid-4' });
      mockPrisma.job.update.mockResolvedValue({});

      mockCorrelationService.registerPending.mockRejectedValue({
        error_code: 610,
        error: 'SEARCH_PAPERS_ERROR',
      });

      try {
        await service.searchPapers(userId, sampleSearchDto);
        fail('Should have thrown BadRequestException');
      } catch (err: any) {
        expect(err).toBeInstanceOf(BadRequestException);
        const res = err.getResponse();
        expect(res.errorCode).toBe(610);
        expect(res.error).toBe('SEARCH_PAPERS_ERROR');
      }

      expect(mockPrisma.job.update).toHaveBeenCalledWith({
        where: { id: 'job-uuid-4' },
        data: expect.objectContaining({
          status: JobStatus.error,
          errorCode: '610',
        }),
      });
    });

    it('should handle generic error message rejection from correlation service', async () => {
      mockPrisma.document.findFirst.mockResolvedValue({ id: documentId });
      mockPrisma.job.create.mockResolvedValue({ id: 'job-uuid-5' });
      mockPrisma.job.update.mockResolvedValue({});

      mockCorrelationService.registerPending.mockRejectedValue(
        new Error('Network drop'),
      );

      await expect(
        service.searchPapers(userId, sampleSearchDto),
      ).rejects.toThrow(BadRequestException);

      expect(mockPrisma.job.update).toHaveBeenCalledWith({
        where: { id: 'job-uuid-5' },
        data: expect.objectContaining({
          status: JobStatus.error,
          errorCode: '610',
          errorMessage: 'Network drop',
        }),
      });
    });
  });
});
