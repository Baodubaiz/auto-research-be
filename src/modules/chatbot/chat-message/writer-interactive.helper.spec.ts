import { jest } from '@jest/globals';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ChatSender, JobStatus } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { WriterInteractiveHelper } from './writer-interactive.helper';

describe('WriterInteractiveHelper', () => {
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      chatSession: { findFirst: jest.fn<any>() },
      chatMessage: {
        findMany: jest.fn<any>(),
        create: jest.fn<any>(),
      },
      job: {
        update: jest.fn<any>().mockResolvedValue({}),
      },
    };
  });

  describe('ensureOwnedSession', () => {
    it('should return session when found', async () => {
      mockPrisma.chatSession.findFirst.mockResolvedValue({
        id: 's1',
        userId: 'u1',
      });
      const res = await WriterInteractiveHelper.ensureOwnedSession(
        mockPrisma as PrismaService,
        'u1',
        's1',
      );
      expect(res.id).toBe('s1');
    });

    it('should throw NotFoundException when session is missing', async () => {
      mockPrisma.chatSession.findFirst.mockResolvedValue(null);
      await expect(
        WriterInteractiveHelper.ensureOwnedSession(
          mockPrisma as PrismaService,
          'u1',
          's1',
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getChatHistory', () => {
    it('should map messages to role and content', async () => {
      mockPrisma.chatMessage.findMany.mockResolvedValue([
        { sender: ChatSender.user, message: 'Hello' },
        { sender: ChatSender.assistant, message: 'Hi there' },
      ]);
      const res = await WriterInteractiveHelper.getChatHistory(
        mockPrisma as PrismaService,
        's1',
      );
      expect(res).toEqual([
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there' },
      ]);
    });
  });

  describe('saveMessage', () => {
    it('should create message in DB', async () => {
      mockPrisma.chatMessage.create.mockResolvedValue({ id: 'm1' });
      const res = await WriterInteractiveHelper.saveMessage(
        mockPrisma as PrismaService,
        's1',
        ChatSender.user,
        'Draft message',
        { meta: true },
      );
      expect(res).toEqual({ id: 'm1' });
      expect(mockPrisma.chatMessage.create).toHaveBeenCalledWith({
        data: {
          sessionId: 's1',
          sender: ChatSender.user,
          message: 'Draft message',
          metadata: { meta: true },
        },
      });
    });
  });

  describe('extractText and extractErrorMsg', () => {
    it('should extract text from response fields or stringify object', () => {
      expect(
        WriterInteractiveHelper.extractText({ response: 'Res text' }),
      ).toBe('Res text');
      expect(WriterInteractiveHelper.extractText({ answer: 'Ans text' })).toBe(
        'Ans text',
      );
      expect(WriterInteractiveHelper.extractText({ message: 'Msg text' })).toBe(
        'Msg text',
      );
      expect(
        WriterInteractiveHelper.extractText({ content: 'Content text' }),
      ).toBe('Content text');
      expect(
        WriterInteractiveHelper.extractText({ ai_message: 'Ai text' }),
      ).toBe('Ai text');
      expect(WriterInteractiveHelper.extractText({ foo: { bar: 1 } })).toBe('');
      expect(
        WriterInteractiveHelper.extractText({ content: { key: 123 } }),
      ).toBe('{"key":123}');
    });

    it('should extract error message safely', () => {
      expect(
        WriterInteractiveHelper.extractErrorMsg({ message: 'Boom' }, 652),
      ).toBe('Boom');
      expect(
        WriterInteractiveHelper.extractErrorMsg({ error: 'Fail' }, 652),
      ).toBe('Fail');
      expect(
        WriterInteractiveHelper.extractErrorMsg('string err', 652),
      ).toBeDefined();
    });
  });

  describe('failJob', () => {
    it('should update job status to error and throw BadRequestException', async () => {
      await expect(
        WriterInteractiveHelper.failJob(
          mockPrisma as PrismaService,
          'j1',
          652,
          'Failed job',
        ),
      ).rejects.toThrow(BadRequestException);

      expect(mockPrisma.job.update).toHaveBeenCalledWith({
        where: { id: 'j1' },
        data: {
          status: JobStatus.error,
          errorCode: '652',
          errorMessage: 'Failed job',
        },
      });
    });
  });
});
