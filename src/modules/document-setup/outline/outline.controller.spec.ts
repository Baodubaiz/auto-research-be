import { jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { OutlineController } from './outline.controller';
import { OutlineService } from './outline.service';
import { OutlineAiService } from './outline-ai.service';
import { CreateOutlineDto } from './dto/create-outline.dto';
import { UpdateOutlineDto } from './dto/update-outline.dto';
import {
  GenerateOutlineAiDto,
  GenerateOutlineWithRefsDto,
  ModifyOutlineAiDto,
  UpdateUserRefsDto,
} from './dto/outline-ai.dto';

describe('OutlineController', () => {
  let controller: OutlineController;
  let mockOutlineService: Record<string, any>;
  let mockOutlineAiService: Record<string, any>;

  const userId = '00000000-0000-0000-0000-000000000001';
  const documentId = '00000000-0000-0000-0000-000000000002';

  beforeEach(async () => {
    mockOutlineService = {
      create: jest.fn<any>(),
      findByDocument: jest.fn<any>(),
      findOne: jest.fn<any>(),
      update: jest.fn<any>(),
      remove: jest.fn<any>(),
    };

    mockOutlineAiService = {
      generateOutline: jest.fn<any>(),
      modifyOutline: jest.fn<any>(),
      generateOutlineWithRefs: jest.fn<any>(),
      updateUserRefs: jest.fn<any>(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [OutlineController],
      providers: [
        { provide: OutlineService, useValue: mockOutlineService },
        { provide: OutlineAiService, useValue: mockOutlineAiService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<OutlineController>(OutlineController);
  });

  describe('AI Endpoints', () => {
    it('should delegate generateOutline to outlineAiService', async () => {
      const dto: GenerateOutlineAiDto = { documentId, title: 'Test Outline' };
      mockOutlineAiService.generateOutline.mockResolvedValue({
        jobId: 'job-1',
      });

      const res = await controller.generateOutline(userId, dto);
      expect(res).toEqual({ jobId: 'job-1' });
      expect(mockOutlineAiService.generateOutline).toHaveBeenCalledWith(
        userId,
        dto,
      );
    });

    it('should delegate modifyOutline to outlineAiService', async () => {
      const dto: ModifyOutlineAiDto = {
        documentId,
        instruction: 'Add section',
      };
      mockOutlineAiService.modifyOutline.mockResolvedValue({ jobId: 'job-2' });

      const res = await controller.modifyOutline(userId, dto);
      expect(res).toEqual({ jobId: 'job-2' });
      expect(mockOutlineAiService.modifyOutline).toHaveBeenCalledWith(
        userId,
        dto,
      );
    });

    it('should delegate generateOutlineWithRefs to outlineAiService', async () => {
      const dto: GenerateOutlineWithRefsDto = {
        documentId,
        referenceIds: ['ref-1'],
      };
      mockOutlineAiService.generateOutlineWithRefs.mockResolvedValue({
        jobId: 'job-3',
      });

      const res = await controller.generateOutlineWithRefs(userId, dto);
      expect(res).toEqual({ jobId: 'job-3' });
      expect(mockOutlineAiService.generateOutlineWithRefs).toHaveBeenCalledWith(
        userId,
        dto,
      );
    });

    it('should delegate updateUserRefs to outlineAiService', async () => {
      const dto: UpdateUserRefsDto = {
        documentId,
        referenceIds: ['ref-a', 'ref-b'],
      };
      mockOutlineAiService.updateUserRefs.mockResolvedValue({ jobId: 'job-4' });

      const res = await controller.updateUserRefs(userId, dto);
      expect(res).toEqual({ jobId: 'job-4' });
      expect(mockOutlineAiService.updateUserRefs).toHaveBeenCalledWith(
        userId,
        dto,
      );
    });
  });

  describe('CRUD Endpoints', () => {
    it('should delegate create to outlineService', async () => {
      const dto: CreateOutlineDto = { documentId, totalWordCount: 5000 };
      mockOutlineService.create.mockResolvedValue({ id: 'out-1', ...dto });

      const res = await controller.create(userId, dto);
      expect(res.id).toBe('out-1');
      expect(mockOutlineService.create).toHaveBeenCalledWith(userId, dto);
    });

    it('should delegate findByDocument to outlineService', async () => {
      mockOutlineService.findByDocument.mockResolvedValue({ id: 'out-1' });

      const res = await controller.findByDocument(userId, documentId);
      expect(res).toEqual({ id: 'out-1' });
      expect(mockOutlineService.findByDocument).toHaveBeenCalledWith(
        userId,
        documentId,
      );
    });

    it('should delegate findOne to outlineService', async () => {
      mockOutlineService.findOne.mockResolvedValue({ id: 'out-1' });

      const res = await controller.findOne(userId, 'out-1');
      expect(res).toEqual({ id: 'out-1' });
      expect(mockOutlineService.findOne).toHaveBeenCalledWith(userId, 'out-1');
    });

    it('should delegate update to outlineService', async () => {
      const dto: UpdateOutlineDto = { totalWordCount: 6000 };
      mockOutlineService.update.mockResolvedValue({ id: 'out-1', ...dto });

      const res = await controller.update(userId, 'out-1', dto);
      expect(res.id).toBe('out-1');
      expect(mockOutlineService.update).toHaveBeenCalledWith(
        userId,
        'out-1',
        dto,
      );
    });

    it('should delegate remove to outlineService', async () => {
      mockOutlineService.remove.mockResolvedValue({
        id: 'out-1',
        deleted: true,
      });

      const res = await controller.remove(userId, 'out-1');
      expect(res.deleted).toBe(true);
      expect(mockOutlineService.remove).toHaveBeenCalledWith(userId, 'out-1');
    });
  });
});
