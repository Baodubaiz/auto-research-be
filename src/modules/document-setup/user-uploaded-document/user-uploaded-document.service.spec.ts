import { jest } from '@jest/globals';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../../database/prisma.service';
import { UserUploadedDocumentService } from './user-uploaded-document.service';

describe('UserUploadedDocumentService', () => {
  let service: UserUploadedDocumentService;
  let mockPrisma: Record<string, any>;

  const userId = '00000000-0000-0000-0000-000000000001';
  const documentId = '00000000-0000-0000-0000-000000000002';
  const fileId = '00000000-0000-0000-0000-000000000003';

  beforeEach(async () => {
    mockPrisma = {
      document: { findUnique: jest.fn<any>() },
      userUploadedDocument: {
        create: jest.fn<any>(),
        findMany: jest.fn<any>(),
        findFirst: jest.fn<any>(),
        update: jest.fn<any>(),
        delete: jest.fn<any>(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserUploadedDocumentService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<UserUploadedDocumentService>(
      UserUploadedDocumentService,
    );
  });

  describe('create', () => {
    it('should create uploaded document if document owned', async () => {
      mockPrisma.document.findUnique.mockResolvedValue({ id: documentId });
      mockPrisma.userUploadedDocument.create.mockResolvedValue({
        id: fileId,
        fileName: 'test.pdf',
      });

      const res = await service.create(userId, {
        documentId,
        fileName: 'test.pdf',
      });
      expect(res.id).toBe(fileId);
    });

    it('should throw NotFoundException if document not owned', async () => {
      mockPrisma.document.findUnique.mockResolvedValue(null);
      await expect(
        service.create(userId, { documentId, fileName: 'test.pdf' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should throw BadRequestException if documentId missing', async () => {
      await expect(service.findAll(userId, '')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should return files for document', async () => {
      mockPrisma.document.findUnique.mockResolvedValue({ id: documentId });
      mockPrisma.userUploadedDocument.findMany.mockResolvedValue([
        { id: fileId },
      ]);

      const res = await service.findAll(userId, documentId);
      expect(res).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException if file not found', async () => {
      mockPrisma.userUploadedDocument.findFirst.mockResolvedValue(null);
      await expect(service.findOne(userId, fileId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return file if found', async () => {
      mockPrisma.userUploadedDocument.findFirst.mockResolvedValue({
        id: fileId,
      });
      const res = await service.findOne(userId, fileId);
      expect(res.id).toBe(fileId);
    });
  });

  describe('update', () => {
    it('should update file', async () => {
      mockPrisma.userUploadedDocument.findFirst.mockResolvedValue({
        id: fileId,
      });
      mockPrisma.userUploadedDocument.update.mockResolvedValue({
        id: fileId,
        title: 'New',
      });

      const res = await service.update(userId, fileId, { title: 'New' });
      expect(res.title).toBe('New');
    });
  });

  describe('remove', () => {
    it('should remove file', async () => {
      mockPrisma.userUploadedDocument.findFirst.mockResolvedValue({
        id: fileId,
      });
      mockPrisma.userUploadedDocument.delete.mockResolvedValue({});

      const res = await service.remove(userId, fileId);
      expect(res.message).toContain('deleted successfully');
    });
  });
});
