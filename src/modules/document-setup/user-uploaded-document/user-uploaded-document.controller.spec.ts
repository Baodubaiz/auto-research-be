import { jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { UserUploadedDocumentController } from './user-uploaded-document.controller';
import { UserUploadedDocumentService } from './user-uploaded-document.service';
import { UserUploadedDocumentAiService } from './user-uploaded-document-ai.service';
import { CreateUserUploadedDocumentDto } from './dto/create-user-uploaded-document.dto';
import { UpdateUserUploadedDocumentDto } from './dto/update-user-uploaded-document.dto';
import {
  ProcessUploadedDocDto,
  SearchUploadedDocsDto,
  TriggerEmbedDocDto,
  TriggerParseDocDto,
} from './dto/user-doc-kafka.dto';

describe('UserUploadedDocumentController', () => {
  let controller: UserUploadedDocumentController;
  let mockService: Record<string, any>;
  let mockAiService: Record<string, any>;

  const userId = '00000000-0000-0000-0000-000000000001';
  const fileId = '00000000-0000-0000-0000-000000000002';
  const documentId = '00000000-0000-0000-0000-000000000003';

  beforeEach(async () => {
    mockService = {
      create: jest.fn<any>(),
      findAll: jest.fn<any>(),
      findOne: jest.fn<any>(),
      update: jest.fn<any>(),
      remove: jest.fn<any>(),
    };

    mockAiService = {
      processDocument: jest.fn<any>(),
      parseDocument: jest.fn<any>(),
      embedDocument: jest.fn<any>(),
      searchUploadedDocuments: jest.fn<any>(),
      deleteDocumentVectors: jest.fn<any>(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserUploadedDocumentController],
      providers: [
        { provide: UserUploadedDocumentService, useValue: mockService },
        { provide: UserUploadedDocumentAiService, useValue: mockAiService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<UserUploadedDocumentController>(
      UserUploadedDocumentController,
    );
  });

  describe('AI Endpoints', () => {
    it('should delegate processDocument to aiService', async () => {
      const dto: ProcessUploadedDocDto = { fileUrl: 'https://minio/pdf' };
      mockAiService.processDocument.mockResolvedValue({ success: true });

      const res = await controller.processDocument(userId, fileId, dto);
      expect(res).toEqual({ success: true });
      expect(mockAiService.processDocument).toHaveBeenCalledWith(
        userId,
        fileId,
        dto,
      );
    });

    it('should delegate parseDocument to aiService', async () => {
      const dto: TriggerParseDocDto = {};
      mockAiService.parseDocument.mockResolvedValue({ jobId: 'job-parse' });

      const res = await controller.parseDocument(userId, fileId, dto);
      expect(res).toEqual({ jobId: 'job-parse' });
      expect(mockAiService.parseDocument).toHaveBeenCalledWith(
        userId,
        fileId,
        dto,
      );
    });

    it('should delegate embedDocument to aiService', async () => {
      const dto: TriggerEmbedDocDto = {};
      mockAiService.embedDocument.mockResolvedValue({ jobId: 'job-embed' });

      const res = await controller.embedDocument(userId, fileId, dto);
      expect(res).toEqual({ jobId: 'job-embed' });
      expect(mockAiService.embedDocument).toHaveBeenCalledWith(
        userId,
        fileId,
        dto,
      );
    });

    it('should delegate searchDocuments to aiService', async () => {
      const dto: SearchUploadedDocsDto = { documentId, query: 'transformer' };
      mockAiService.searchUploadedDocuments.mockResolvedValue({ chunks: [] });

      const res = await controller.searchDocuments(userId, dto);
      expect(res).toEqual({ chunks: [] });
      expect(mockAiService.searchUploadedDocuments).toHaveBeenCalledWith(
        userId,
        dto,
      );
    });

    it('should delegate remove to deleteDocumentVectors', async () => {
      mockAiService.deleteDocumentVectors.mockResolvedValue({ success: true });

      const res = await controller.remove(userId, fileId);
      expect(res).toEqual({ success: true });
      expect(mockAiService.deleteDocumentVectors).toHaveBeenCalledWith(
        userId,
        fileId,
      );
    });
  });

  describe('CRUD Endpoints', () => {
    it('should delegate create to service', async () => {
      const dto: CreateUserUploadedDocumentDto = {
        documentId,
        fileName: 'a.pdf',
      };
      mockService.create.mockResolvedValue({ id: fileId, ...dto });

      const res = await controller.create(userId, dto);
      expect(res.id).toBe(fileId);
      expect(mockService.create).toHaveBeenCalledWith(userId, dto);
    });

    it('should delegate findAll to service', async () => {
      mockService.findAll.mockResolvedValue([{ id: fileId }]);

      const res = await controller.findAll(userId, documentId);
      expect(res).toHaveLength(1);
      expect(mockService.findAll).toHaveBeenCalledWith(userId, documentId);
    });

    it('should delegate findOne to service', async () => {
      mockService.findOne.mockResolvedValue({ id: fileId });

      const res = await controller.findOne(userId, fileId);
      expect(res.id).toBe(fileId);
      expect(mockService.findOne).toHaveBeenCalledWith(userId, fileId);
    });

    it('should delegate update to service', async () => {
      const dto: UpdateUserUploadedDocumentDto = { title: 'Updated Title' };
      mockService.update.mockResolvedValue({ id: fileId, ...dto });

      const res = await controller.update(userId, fileId, dto);
      expect(res.title).toBe('Updated Title');
      expect(mockService.update).toHaveBeenCalledWith(userId, fileId, dto);
    });
  });
});
