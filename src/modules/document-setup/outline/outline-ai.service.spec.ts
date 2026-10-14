import { jest } from '@jest/globals';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../../database/prisma.service';
import { OutlineAiDispatcher } from './outline-ai.dispatcher';
import { OutlineAiService } from './outline-ai.service';
import {
  GenerateOutlineAiDto,
  GenerateOutlineWithRefsDto,
  ModifyOutlineAiDto,
  UpdateUserRefsDto,
} from './dto/outline-ai.dto';

describe('OutlineAiService', () => {
  let service: OutlineAiService;
  let mockPrisma: Record<string, any>;
  let mockDispatcher: Record<string, any>;

  const userId = '00000000-0000-0000-0000-000000000001';
  const documentId = '00000000-0000-0000-0000-000000000002';

  beforeEach(async () => {
    mockPrisma = {
      document: { findFirst: jest.fn<any>() },
      proposal: { findFirst: jest.fn<any>() },
      outline: { findUnique: jest.fn<any>(), upsert: jest.fn<any>() },
      documentReference: {
        findUnique: jest.fn<any>(),
        create: jest.fn<any>(),
      },
    };
    mockDispatcher = { dispatch: jest.fn<any>() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OutlineAiService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: OutlineAiDispatcher, useValue: mockDispatcher },
      ],
    }).compile();

    service = module.get<OutlineAiService>(OutlineAiService);
  });

  describe('ensureDocument', () => {
    it('should throw NotFoundException if document not found', async () => {
      mockPrisma.document.findFirst.mockResolvedValue(null);
      await expect(service.ensureDocument(userId, documentId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('generateOutline', () => {
    const dto: GenerateOutlineAiDto = {
      documentId,
      title: 'Doc Title',
      problemStatement: 'Problem X',
      totalWordCount: 5000,
    };

    it('should dispatch generate_outline and upsert outline on success', async () => {
      mockPrisma.document.findFirst.mockResolvedValue({ id: documentId });
      mockPrisma.outline.upsert.mockResolvedValue({});

      mockDispatcher.dispatch.mockImplementation(async (opt: any) => {
        if (opt.onSuccess) {
          await opt.onSuccess({
            outline: { sections: [{ title: 'Intro' }] },
            total_word_count: 5000,
          });
        }
        return { jobId: 'job-outline-1' };
      });

      const res = await service.generateOutline(userId, dto);
      expect(res.jobId).toBe('job-outline-1');
      expect(mockDispatcher.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'generate_outline',
          errorCode: 617,
        }),
      );
      expect(mockPrisma.outline.upsert).toHaveBeenCalledWith({
        where: { documentId },
        update: {
          totalWordCount: 5000,
          structure: { sections: [{ title: 'Intro' }] },
        },
        create: {
          documentId,
          totalWordCount: 5000,
          structure: { sections: [{ title: 'Intro' }] },
        },
      });
    });

    it('should fetch proposal title and problem when proposalId is provided', async () => {
      mockPrisma.document.findFirst.mockResolvedValue({
        id: documentId,
        title: 'Doc',
      });
      mockPrisma.proposal.findFirst.mockResolvedValue({
        title: 'Prop Title',
        problemStatement: 'Prop Problem',
      });
      mockDispatcher.dispatch.mockResolvedValue({ jobId: 'job-outline-2' });

      await service.generateOutline(userId, {
        documentId,
        proposalId: 'prop-1',
      });
      expect(mockDispatcher.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          kafkaData: expect.objectContaining({
            title: 'Prop Title',
            problem_statement: 'Prop Problem',
          }),
        }),
      );
    });
  });

  describe('modifyOutline', () => {
    const dto: ModifyOutlineAiDto = {
      documentId,
      instruction: 'Add methodology',
      outline: { chapters: ['Intro'] },
    };

    it('should dispatch modify_outline and upsert outline on success', async () => {
      mockPrisma.document.findFirst.mockResolvedValue({ id: documentId });
      mockPrisma.outline.upsert.mockResolvedValue({});

      mockDispatcher.dispatch.mockImplementation(async (opt: any) => {
        if (opt.onSuccess) {
          await opt.onSuccess({
            structure: { chapters: ['Intro', 'Methodology'] },
          });
        }
        return { jobId: 'job-modify-1' };
      });

      const res = await service.modifyOutline(userId, dto);
      expect(res.jobId).toBe('job-modify-1');
      expect(mockDispatcher.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'modify_outline',
          errorCode: 627,
        }),
      );
      expect(mockPrisma.outline.upsert).toHaveBeenCalled();
    });

    it('should fallback to DB outline if outline not provided in dto', async () => {
      mockPrisma.document.findFirst.mockResolvedValue({ id: documentId });
      mockPrisma.outline.findUnique.mockResolvedValue({
        structure: { sections: [] },
      });
      mockDispatcher.dispatch.mockResolvedValue({ jobId: 'job-modify-2' });

      await service.modifyOutline(userId, {
        documentId,
        instruction: 'Revise',
      });
      expect(mockDispatcher.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          kafkaData: expect.objectContaining({ outline: { sections: [] } }),
        }),
      );
    });
  });

  describe('generateOutlineWithRefs', () => {
    const dto: GenerateOutlineWithRefsDto = {
      documentId,
      referenceIds: ['ref-1'],
      outline: { sections: ['S1'] },
    };

    it('should dispatch generate_outline_with_refs with code 626', async () => {
      mockPrisma.document.findFirst.mockResolvedValue({ id: documentId });
      mockPrisma.outline.upsert.mockResolvedValue({});

      mockDispatcher.dispatch.mockImplementation(async (opt: any) => {
        if (opt.onSuccess) {
          await opt.onSuccess({ outline: { sections: ['S1', 'RefSec'] } });
        }
        return { jobId: 'job-refs-1' };
      });

      const res = await service.generateOutlineWithRefs(userId, dto);
      expect(res.jobId).toBe('job-refs-1');
      expect(mockDispatcher.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'generate_outline_with_refs',
          errorCode: 626,
        }),
      );
    });
  });

  describe('updateUserRefs', () => {
    const dto: UpdateUserRefsDto = {
      documentId,
      referenceIds: ['ref-a', 'ref-b'],
    };

    it('should dispatch update_user_refs and persist missing document references', async () => {
      mockPrisma.document.findFirst.mockResolvedValue({ id: documentId });
      mockPrisma.documentReference.findUnique
        .mockResolvedValueOnce({ id: 'exists-1' })
        .mockResolvedValueOnce(null);
      mockPrisma.documentReference.create.mockResolvedValue({});

      mockDispatcher.dispatch.mockImplementation(async (opt: any) => {
        if (opt.onSuccess) await opt.onSuccess({});
        return { jobId: 'job-update-refs' };
      });

      const res = await service.updateUserRefs(userId, dto);
      expect(res.jobId).toBe('job-update-refs');
      expect(mockDispatcher.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'update_user_refs',
          errorCode: 628,
        }),
      );
      expect(mockPrisma.documentReference.create).toHaveBeenCalledWith({
        data: { documentId, referenceId: 'ref-b' },
      });
    });

    it('should throw error when dispatcher rejects with errorCode 628', async () => {
      mockPrisma.document.findFirst.mockResolvedValue({ id: documentId });
      mockDispatcher.dispatch.mockRejectedValue(
        new BadRequestException({
          errorCode: 628,
          message: 'Update refs failed',
        }),
      );

      await expect(service.updateUserRefs(userId, dto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
