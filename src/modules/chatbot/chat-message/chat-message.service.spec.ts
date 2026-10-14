import { jest } from '@jest/globals';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ChatSender } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { ChatMessageService } from './chat-message.service';

describe('ChatMessageService', () => {
  let service: ChatMessageService;
  let mockPrisma: Record<string, any>;

  const userId = '00000000-0000-0000-0000-000000000001';
  const sessionId = '00000000-0000-0000-0000-000000000002';
  const messageId = '00000000-0000-0000-0000-000000000003';

  beforeEach(async () => {
    mockPrisma = {
      chatSession: { findUnique: jest.fn<any>() },
      chatMessage: {
        create: jest.fn<any>(),
        findMany: jest.fn<any>(),
        findFirst: jest.fn<any>(),
        update: jest.fn<any>(),
        delete: jest.fn<any>(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatMessageService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ChatMessageService>(ChatMessageService);
  });

  describe('create', () => {
    it('should create message if session valid', async () => {
      mockPrisma.chatSession.findUnique.mockResolvedValue({ id: sessionId });
      mockPrisma.chatMessage.create.mockResolvedValue({ id: messageId });

      const res = await service.create(userId, {
        sessionId,
        sender: ChatSender.user,
        message: 'Hello',
      });
      expect(res.id).toBe(messageId);
    });

    it('should throw NotFoundException if session invalid', async () => {
      mockPrisma.chatSession.findUnique.mockResolvedValue(null);
      await expect(
        service.create(userId, {
          sessionId,
          sender: ChatSender.user,
          message: 'Hello',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should find all messages', async () => {
      mockPrisma.chatSession.findUnique.mockResolvedValue({ id: sessionId });
      mockPrisma.chatMessage.findMany.mockResolvedValue([{ id: messageId }]);

      const res = await service.findAll(userId, sessionId);
      expect(res).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('should return message if found', async () => {
      mockPrisma.chatMessage.findFirst.mockResolvedValue({ id: messageId });
      const res = await service.findOne(userId, messageId);
      expect(res.id).toBe(messageId);
    });

    it('should throw NotFoundException if not found', async () => {
      mockPrisma.chatMessage.findFirst.mockResolvedValue(null);
      await expect(service.findOne(userId, messageId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update message', async () => {
      mockPrisma.chatMessage.findFirst.mockResolvedValue({ id: messageId });
      mockPrisma.chatMessage.update.mockResolvedValue({
        id: messageId,
        message: 'New text',
      });

      const res = await service.update(userId, messageId, {
        message: 'New text',
      });
      expect(res.message).toBe('New text');
    });
  });

  describe('remove', () => {
    it('should delete message', async () => {
      mockPrisma.chatMessage.findFirst.mockResolvedValue({ id: messageId });
      mockPrisma.chatMessage.delete.mockResolvedValue({});

      const res = await service.remove(userId, messageId);
      expect(res.message).toContain('deleted successfully');
    });
  });

  describe('createForSession', () => {
    it('should create message for session', async () => {
      mockPrisma.chatSession.findUnique.mockResolvedValue({ id: sessionId });
      mockPrisma.chatMessage.create.mockResolvedValue({ id: messageId });

      const res = await service.createForSession(userId, sessionId, {
        sender: ChatSender.user,
        message: 'Nested hello',
      });
      expect(res.id).toBe(messageId);
    });
  });
});
