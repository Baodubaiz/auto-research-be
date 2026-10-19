import { jest } from '@jest/globals';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../../database/prisma.service';
import { ProposalAiDispatcher } from './proposal-ai.dispatcher';
import { ProposalDetailsService } from './proposal-details.service';
import {
  GenerateTitleDescriptionDto,
  GenerateTitleDescriptionNoInfoDto,
  GetResearchTypeDto,
  MixTitlesDto,
} from './dto/proposal-details.dto';

describe('ProposalDetailsService', () => {
  let service: ProposalDetailsService;
  let mockPrisma: Record<string, any>;
  let mockDispatcher: Record<string, any>;

  const userId = '00000000-0000-0000-0000-000000000001';
  const documentId = '00000000-0000-0000-0000-000000000002';

  beforeEach(async () => {
    mockPrisma = {
      document: { findFirst: jest.fn<any>(), update: jest.fn<any>() },
      proposal: { findFirst: jest.fn<any>(), findUnique: jest.fn<any>(), create: jest.fn<any>(), update: jest.fn<any>() },
    };
    mockDispatcher = { dispatch: jest.fn<any>() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProposalDetailsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ProposalAiDispatcher, useValue: mockDispatcher },
      ],
    }).compile();

    service = module.get<ProposalDetailsService>(ProposalDetailsService);
  });

  describe('ensureDocument', () => {
    it('should throw NotFoundException if document not found', async () => {
      mockPrisma.document.findFirst.mockResolvedValue(null);
      await expect(service.ensureDocument(userId, documentId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('generateTitleDescription', () => {
    const dto: GenerateTitleDescriptionDto = {
      documentId,
      title: 'AI in Banking',
      field: 'Finance',
    };

    it('should dispatch with event generate_title_description and upsert proposal', async () => {
      mockPrisma.document.findFirst.mockResolvedValue({ id: documentId });
      mockPrisma.proposal.findFirst.mockResolvedValue({ id: 'prop-1' });
      mockPrisma.proposal.update.mockResolvedValue({});

      mockDispatcher.dispatch.mockImplementation(async (opt: any) => {
        if (opt.onSuccess) {
          await opt.onSuccess({
            problem_statement: 'High fraud rate',
            motivation: 'Reduce fraud with AI',
          });
        }
        return { jobId: 'job-1', success: true };
      });

      const res = await service.generateTitleDescription(userId, dto);
      expect(res.jobId).toBe('job-1');
      expect(mockDispatcher.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'generate_title_description',
          errorCode: 615,
        }),
      );
      expect(mockPrisma.proposal.update).toHaveBeenCalledWith({
        where: { id: 'prop-1' },
        data: {
          problemStatement: 'High fraud rate',
          motivation: 'Reduce fraud with AI',
          researchGap: '',
        },
      });
    });

    it('should create proposal if not existing when proposalId is not provided', async () => {
      mockPrisma.document.findFirst.mockResolvedValue({ id: documentId });
      mockPrisma.proposal.findFirst.mockResolvedValue(null);
      mockPrisma.proposal.create.mockResolvedValue({});

      mockDispatcher.dispatch.mockImplementation(async (opt: any) => {
        if (opt.onSuccess) {
          await opt.onSuccess({ problem_statement: 'P', motivation: 'M' });
        }
        return { jobId: 'job-2' };
      });

      await service.generateTitleDescription(userId, dto);
      expect(mockPrisma.proposal.create).toHaveBeenCalledWith({
        data: { documentId, title: 'AI in Banking', problemStatement: 'P', motivation: 'M', researchGap: '' },
      });
    });

    it('should update specific proposal when proposalId is provided', async () => {
      mockPrisma.document.findFirst.mockResolvedValue({ id: documentId });
      mockPrisma.proposal.update.mockResolvedValue({});

      mockDispatcher.dispatch.mockImplementation(async (opt: any) => {
        if (opt.onSuccess) {
          await opt.onSuccess({ problem_statement: 'P', motivation: 'M' });
        }
        return { jobId: 'job-target' };
      });

      await service.generateTitleDescription(userId, {
        ...dto,
        proposalId: 'prop-target',
      });
      expect(mockPrisma.proposal.update).toHaveBeenCalledWith({
        where: { id: 'prop-target' },
        data: { problemStatement: 'P', motivation: 'M', researchGap: '' },
      });
    });

    it('should throw BadRequestException if dispatcher throws 615', async () => {
      mockPrisma.document.findFirst.mockResolvedValue({ id: documentId });
      mockDispatcher.dispatch.mockRejectedValue(
        new BadRequestException({ errorCode: 615, message: 'AI error' }),
      );
      await expect(
        service.generateTitleDescription(userId, dto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('generateTitleDescriptionNoInfo', () => {
    const dto: GenerateTitleDescriptionNoInfoDto = {
      documentId,
      title: 'Self-Input Title',
      description: 'User custom description',
    };

    it('should dispatch with event generate_title_description_no_info and code 624', async () => {
      mockPrisma.document.findFirst.mockResolvedValue({ id: documentId });
      mockPrisma.proposal.findFirst.mockResolvedValue(null);
      mockPrisma.proposal.create.mockResolvedValue({});

      mockDispatcher.dispatch.mockImplementation(async (opt: any) => {
        if (opt.onSuccess) {
          await opt.onSuccess({ problemStatement: 'Prob', motivation: 'Mot' });
        }
        return { jobId: 'job-no-info' };
      });

      const res = await service.generateTitleDescriptionNoInfo(userId, dto);
      expect(res.jobId).toBe('job-no-info');
      expect(mockDispatcher.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'generate_title_description_no_info',
          errorCode: 624,
        }),
      );
    });
  });

  describe('mixTitles', () => {
    const dto: MixTitlesDto = {
      documentId,
      titles: ['Title A', 'Title B'],
      field: 'CS',
    };

    it('should dispatch with event mix_titles and create mixed proposals', async () => {
      mockPrisma.document.findFirst.mockResolvedValue({ id: documentId });
      mockPrisma.proposal.create.mockResolvedValue({});

      mockDispatcher.dispatch.mockImplementation(async (opt: any) => {
        if (opt.onSuccess) {
          await opt.onSuccess({
            proposals: [
              {
                title: 'Mixed Title 1',
                problemStatement: 'Problem 1',
                motivation: 'Motiv 1',
              },
            ],
          });
        }
        return { jobId: 'job-mix' };
      });

      const res = await service.mixTitles(userId, dto);
      expect(res.jobId).toBe('job-mix');
      expect(mockDispatcher.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'mix_titles',
          errorCode: 616,
        }),
      );
      expect(mockPrisma.proposal.create).toHaveBeenCalledWith({
        data: {
          documentId,
          title: 'Mixed Title 1',
          problemStatement: 'Problem 1',
          motivation: 'Motiv 1',
          researchGap: null,
        },
      });
    });
  });

  describe('getResearchType', () => {
    const dto: GetResearchTypeDto = {
      documentId,
      title: 'Title X',
      problemStatement: 'P',
    };

    it('should dispatch with event get_research_type and update document researchType', async () => {
      mockPrisma.document.findFirst.mockResolvedValue({ id: documentId });
      mockPrisma.document.update.mockResolvedValue({});

      mockDispatcher.dispatch.mockImplementation(async (opt: any) => {
        if (opt.onSuccess) {
          await opt.onSuccess({ research_type: 'quantitative' });
        }
        return { jobId: 'job-rt', research_type: 'quantitative' };
      });

      const res = await service.getResearchType(userId, dto);
      expect((res as any).research_type).toBe('quantitative');
      expect(mockDispatcher.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'get_research_type',
          errorCode: 623,
        }),
      );
      expect(mockPrisma.document.update).toHaveBeenCalledWith({
        where: { id: documentId },
        data: { researchType: 'quantitative' },
      });
    });
  });
});
