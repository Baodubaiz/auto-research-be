import { jest } from '@jest/globals';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../../database/prisma.service';
import { ProposalAiDispatcher } from './proposal-ai.dispatcher';
import { ProposalIdeationService } from './proposal-ideation.service';
import {
  GenerateDomainsDto,
  GenerateKeywordsDto,
  GenerateSubdomainsDto,
  GenerateTitlesDto,
} from './dto/generate-ideation.dto';

describe('ProposalIdeationService', () => {
  let service: ProposalIdeationService;
  let mockPrisma: Record<string, any>;
  let mockDispatcher: Record<string, any>;

  const userId = '00000000-0000-0000-0000-000000000001';
  const documentId = '00000000-0000-0000-0000-000000000002';

  beforeEach(async () => {
    mockPrisma = {
      document: {
        findFirst: jest.fn<any>(),
        update: jest.fn<any>(),
      },
      documentKeyword: {
        findFirst: jest.fn<any>(),
        create: jest.fn<any>(),
        update: jest.fn<any>(),
      },
    };

    mockDispatcher = {
      dispatch: jest.fn<any>(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProposalIdeationService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ProposalAiDispatcher, useValue: mockDispatcher },
      ],
    }).compile();

    service = module.get<ProposalIdeationService>(ProposalIdeationService);
  });

  describe('ensureDocument', () => {
    it('should throw NotFoundException if document does not exist for user', async () => {
      mockPrisma.document.findFirst.mockResolvedValue(null);
      await expect(service.ensureDocument(userId, documentId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return document if found', async () => {
      const doc = { id: documentId, userId, field: 'CS' };
      mockPrisma.document.findFirst.mockResolvedValue(doc);
      const result = await service.ensureDocument(userId, documentId);
      expect(result).toEqual(doc);
    });
  });

  describe('generateDomains', () => {
    const dto: GenerateDomainsDto = {
      documentId,
      numberOfDomains: 3,
    };

    it('should dispatch generate_domains and update document domains on success', async () => {
      mockPrisma.document.findFirst.mockResolvedValue({
        id: documentId,
        field: 'Economics',
      });
      mockPrisma.document.update.mockResolvedValue({});

      const domains = [{ id: 'd1', name: 'Fintech' }];
      mockDispatcher.dispatch.mockImplementation(async (opt: any) => {
        if (opt.onSuccess) {
          await opt.onSuccess({ domains });
        }
        return { jobId: 'job-dom-1', domains };
      });

      const result = await service.generateDomains(userId, dto);
      expect(result.jobId).toBe('job-dom-1');
      expect(mockDispatcher.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'generate_domains',
          errorCode: 611,
          kafkaData: {
            field: 'Economics',
            number_of_domains: 3,
          },
        }),
      );
      expect(mockPrisma.document.update).toHaveBeenCalledWith({
        where: { id: documentId },
        data: { domains },
      });
    });

    it('should throw BadRequestException if dispatcher rejects with error', async () => {
      mockPrisma.document.findFirst.mockResolvedValue({ id: documentId });
      mockDispatcher.dispatch.mockRejectedValue(
        new BadRequestException({
          errorCode: 611,
          error: 'GENERATE_DOMAINS_ERROR',
        }),
      );

      await expect(service.generateDomains(userId, dto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('generateSubdomains', () => {
    const dto: GenerateSubdomainsDto = {
      documentId,
      field: 'Computer Science',
      domain: 'AI',
      numberOfSubdomains: 4,
    };

    it('should dispatch generate_subdomains with code 612', async () => {
      mockPrisma.document.findFirst.mockResolvedValue({ id: documentId });
      mockDispatcher.dispatch.mockResolvedValue({
        jobId: 'job-sub-1',
        subdomains: ['NLP', 'CV'],
      });

      const result = await service.generateSubdomains(userId, dto);
      expect(result.jobId).toBe('job-sub-1');
      expect(mockDispatcher.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'generate_subdomains',
          errorCode: 612,
          kafkaData: {
            field: 'Computer Science',
            domain: 'AI',
            number_of_subdomains: 4,
          },
        }),
      );
    });
  });

  describe('generateKeywords', () => {
    const dto: GenerateKeywordsDto = {
      documentId,
      field: 'Computer Science',
      domain: 'AI',
      subdomains: ['NLP'],
    };

    it('should dispatch generate_keywords and create documentKeyword on success', async () => {
      mockPrisma.document.findFirst.mockResolvedValue({ id: documentId });
      mockPrisma.documentKeyword.findFirst.mockResolvedValue(null);
      mockPrisma.documentKeyword.create.mockResolvedValue({});

      mockDispatcher.dispatch.mockImplementation(async (opt: any) => {
        if (opt.onSuccess) {
          await opt.onSuccess({
            keywords_main: ['Transformer'],
            keywords_sub: ['Attention'],
          });
        }
        return { jobId: 'job-kw-1' };
      });

      const result = await service.generateKeywords(userId, dto);
      expect(result.jobId).toBe('job-kw-1');
      expect(mockDispatcher.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'generate_keywords',
          errorCode: 613,
        }),
      );
      expect(mockPrisma.documentKeyword.create).toHaveBeenCalledWith({
        data: {
          documentId,
          keywordsMain: ['Transformer'],
          keywordsSub: ['Attention'],
        },
      });
    });

    it('should update documentKeyword if already exists', async () => {
      mockPrisma.document.findFirst.mockResolvedValue({ id: documentId });
      mockPrisma.documentKeyword.findFirst.mockResolvedValue({
        id: 'kw-exist',
      });
      mockPrisma.documentKeyword.update.mockResolvedValue({});

      mockDispatcher.dispatch.mockImplementation(async (opt: any) => {
        if (opt.onSuccess) {
          await opt.onSuccess({
            keywordsMain: ['Deep Learning'],
            keywordsSub: ['CNN'],
          });
        }
        return { jobId: 'job-kw-2' };
      });

      await service.generateKeywords(userId, dto);
      expect(mockPrisma.documentKeyword.update).toHaveBeenCalledWith({
        where: { id: 'kw-exist' },
        data: {
          keywordsMain: ['Deep Learning'],
          keywordsSub: ['CNN'],
        },
      });
    });
  });

  describe('generateTitles', () => {
    const dto: GenerateTitlesDto = {
      documentId,
      field: 'CS',
      domain: 'AI',
      subdomains: ['NLP'],
      keywords: ['Transformer'],
    };

    it('should dispatch generate_titles with code 614', async () => {
      mockPrisma.document.findFirst.mockResolvedValue({ id: documentId });
      mockDispatcher.dispatch.mockResolvedValue({
        jobId: 'job-tit-1',
        proposals: [{ title: 'Paper A' }],
      });

      const result = await service.generateTitles(userId, dto);
      expect(result.jobId).toBe('job-tit-1');
      expect(mockDispatcher.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'generate_titles',
          errorCode: 614,
        }),
      );
    });
  });
});
