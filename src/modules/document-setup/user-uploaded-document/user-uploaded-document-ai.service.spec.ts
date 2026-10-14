import { jest } from '@jest/globals';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { FileProcessingStatus } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { UserDocAiDispatcher } from './user-doc-ai.dispatcher';
import { UserUploadedDocumentAiService } from './user-uploaded-document-ai.service';
import {
  ProcessUploadedDocDto,
  SearchUploadedDocsDto,
  TriggerEmbedDocDto,
  TriggerParseDocDto,
} from './dto/user-doc-kafka.dto';

describe('UserUploadedDocumentAiService', () => {
  let service: UserUploadedDocumentAiService;
  let mockPrisma: Record<string, any>;
  let mockDispatcher: Record<string, any>;

  const userId = '00000000-0000-0000-0000-000000000001';
  const documentId = '00000000-0000-0000-0000-000000000002';
  const fileId = '00000000-0000-0000-0000-000000000003';

  const mockFile = {
    id: fileId,
    documentId,
    fileName: 'paper.pdf',
    title: 'Paper Title',
    processingStatus: FileProcessingStatus.uploaded,
    isEmbedded: false,
  };

  beforeEach(async () => {
    mockPrisma = {
      document: { findFirst: jest.fn<any>() },
      userUploadedDocument: {
        findFirst: jest.fn<any>(),
        update: jest.fn<any>(),
        delete: jest.fn<any>(),
        count: jest.fn<any>(),
      },
    };

    mockDispatcher = {
      dispatch: jest.fn<any>(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserUploadedDocumentAiService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: UserDocAiDispatcher, useValue: mockDispatcher },
      ],
    }).compile();

    service = module.get<UserUploadedDocumentAiService>(
      UserUploadedDocumentAiService,
    );
  });

  describe('ensureOwnedFile', () => {
    it('should throw NotFoundException if file not found or not owned', async () => {
      mockPrisma.userUploadedDocument.findFirst.mockResolvedValue(null);
      await expect(service.ensureOwnedFile(userId, fileId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return file if owned', async () => {
      mockPrisma.userUploadedDocument.findFirst.mockResolvedValue(mockFile);
      const res = await service.ensureOwnedFile(userId, fileId);
      expect(res).toEqual(mockFile);
    });
  });

  describe('processDocument', () => {
    const dto: ProcessUploadedDocDto = { fileUrl: 'https://minio/paper.pdf' };

    it('should execute 2-step pipeline (parse -> embed) and mark embedded on success', async () => {
      mockPrisma.userUploadedDocument.findFirst.mockResolvedValue(mockFile);
      mockPrisma.userUploadedDocument.update.mockResolvedValue({});

      mockDispatcher.dispatch
        .mockResolvedValueOnce({ jobId: 'job-parse', parsed: true })
        .mockImplementationOnce(async (opt: any) => {
          if (opt.onSuccess) await opt.onSuccess();
          return { jobId: 'job-embed', embedded: true };
        });

      const res = await service.processDocument(userId, fileId, dto);
      expect(res.status).toBe(FileProcessingStatus.embedded);
      expect(res.isEmbedded).toBe(true);

      // Verify parse dispatch
      expect(mockDispatcher.dispatch).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          eventType: 'user_documents',
          errorCode: 620,
        }),
      );
      // Verify embed dispatch
      expect(mockDispatcher.dispatch).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          eventType: 'embed_user_documents',
          errorCode: 621,
        }),
      );
      expect(mockPrisma.userUploadedDocument.update).toHaveBeenCalledWith({
        where: { id: fileId },
        data: {
          processingStatus: FileProcessingStatus.embedded,
          isEmbedded: true,
        },
      });
    });

    it('should update status to error if parse fails', async () => {
      mockPrisma.userUploadedDocument.findFirst.mockResolvedValue(mockFile);
      mockPrisma.userUploadedDocument.update.mockResolvedValue({});

      mockDispatcher.dispatch.mockImplementationOnce(async (opt: any) => {
        if (opt.onError) await opt.onError(new Error('Parse error'));
        throw new BadRequestException({ errorCode: 620 });
      });

      await expect(
        service.processDocument(userId, fileId, dto),
      ).rejects.toThrow(BadRequestException);
      expect(mockPrisma.userUploadedDocument.update).toHaveBeenCalledWith({
        where: { id: fileId },
        data: { processingStatus: FileProcessingStatus.error },
      });
    });
  });

  describe('parseDocument', () => {
    it('should dispatch user_documents event with code 620', async () => {
      mockPrisma.userUploadedDocument.findFirst.mockResolvedValue(mockFile);
      mockPrisma.userUploadedDocument.update.mockResolvedValue({});
      mockDispatcher.dispatch.mockResolvedValue({ jobId: 'job-p' });

      const dto: TriggerParseDocDto = { fileUrl: 'custom-url' };
      const res = await service.parseDocument(userId, fileId, dto);
      expect(res.jobId).toBe('job-p');
      expect(mockDispatcher.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'user_documents',
          errorCode: 620,
        }),
      );
    });
  });

  describe('embedDocument', () => {
    it('should dispatch embed_user_documents event with code 621 and update status', async () => {
      mockPrisma.userUploadedDocument.findFirst.mockResolvedValue(mockFile);
      mockPrisma.userUploadedDocument.update.mockResolvedValue({});
      mockDispatcher.dispatch.mockImplementation(async (opt: any) => {
        if (opt.onSuccess) await opt.onSuccess();
        return { jobId: 'job-e' };
      });

      const dto: TriggerEmbedDocDto = {};
      const res = await service.embedDocument(userId, fileId, dto);
      expect(res.jobId).toBe('job-e');
      expect(mockDispatcher.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'embed_user_documents',
          errorCode: 621,
        }),
      );
      expect(mockPrisma.userUploadedDocument.update).toHaveBeenCalledWith({
        where: { id: fileId },
        data: {
          processingStatus: FileProcessingStatus.embedded,
          isEmbedded: true,
        },
      });
    });
  });

  describe('searchUploadedDocuments', () => {
    const dto: SearchUploadedDocsDto = {
      documentId,
      query: 'deep learning architecture',
      topK: 3,
    };

    it('should throw BadRequestException if no documents are embedded yet', async () => {
      mockPrisma.document.findFirst.mockResolvedValue({ id: documentId });
      mockPrisma.userUploadedDocument.count.mockResolvedValue(0);

      await expect(
        service.searchUploadedDocuments(userId, dto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should dispatch search_user_documents and return chunks when documents are embedded', async () => {
      mockPrisma.document.findFirst.mockResolvedValue({ id: documentId });
      mockPrisma.userUploadedDocument.count.mockResolvedValue(2);
      mockDispatcher.dispatch.mockResolvedValue({
        chunks: [{ text: 'Deep learning chunk', score: 0.95 }],
      });

      const res = await service.searchUploadedDocuments(userId, dto);
      expect(res.chunks).toHaveLength(1);
      expect(mockDispatcher.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'search_user_documents',
          errorCode: 625,
          kafkaData: {
            document_id: documentId,
            query: 'deep learning architecture',
            top_k: 3,
          },
        }),
      );
    });
  });

  describe('deleteDocumentVectors', () => {
    it('should dispatch delete_documents with code 622 and delete DB record', async () => {
      mockPrisma.userUploadedDocument.findFirst.mockResolvedValue(mockFile);
      mockPrisma.userUploadedDocument.delete.mockResolvedValue({});
      mockDispatcher.dispatch.mockImplementation(async (opt: any) => {
        if (opt.onSuccess) await opt.onSuccess();
        return { jobId: 'job-del' };
      });

      const res = await service.deleteDocumentVectors(userId, fileId);
      expect(res.success).toBe(true);
      expect(mockDispatcher.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'delete_documents',
          errorCode: 622,
          kafkaData: { file_id: fileId, document_id: documentId },
        }),
      );
      expect(mockPrisma.userUploadedDocument.delete).toHaveBeenCalledWith({
        where: { id: fileId },
      });
    });
  });
});
