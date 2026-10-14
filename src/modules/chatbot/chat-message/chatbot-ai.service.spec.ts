import { jest } from '@jest/globals';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ChatMode, ChatSender } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { ChatbotAiDispatcher } from './chatbot-ai.dispatcher';
import { ChatbotAiService } from './chatbot-ai.service';
import { SendAiMessageDto } from './dto/send-ai-message.dto';

describe('ChatbotAiService', () => {
  let service: ChatbotAiService;
  let mockPrisma: Record<string, any>;
  let mockDispatcher: Record<string, any>;

  const userId = '00000000-0000-0000-0000-000000000001';
  const sessionId = '00000000-0000-0000-0000-000000000002';
  const documentId = '00000000-0000-0000-0000-000000000003';

  const mockOuterSession = {
    id: sessionId,
    userId,
    mode: ChatMode.outer_chatbot,
    documentId: null,
    webSearchEnabled: true,
    language: 'vi',
    model: 'gpt-4o',
  };

  const mockInnerSession = {
    id: sessionId,
    userId,
    mode: ChatMode.inner_chatbot,
    documentId,
    webSearchEnabled: false,
    language: 'vi',
    model: 'localhost',
  };

  beforeEach(async () => {
    mockPrisma = {
      chatSession: { findFirst: jest.fn<any>() },
      chatMessage: {
        findMany: jest.fn<any>(),
        create: jest.fn<any>(),
      },
      userUploadedDocument: { count: jest.fn<any>() },
    };

    mockDispatcher = {
      dispatch: jest.fn<any>(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatbotAiService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ChatbotAiDispatcher, useValue: mockDispatcher },
      ],
    }).compile();

    service = module.get<ChatbotAiService>(ChatbotAiService);
  });

  describe('ensureOwnedSession', () => {
    it('should throw NotFoundException if session does not exist', async () => {
      mockPrisma.chatSession.findFirst.mockResolvedValue(null);
      await expect(
        service.ensureOwnedSession(userId, sessionId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return session if found', async () => {
      mockPrisma.chatSession.findFirst.mockResolvedValue(mockOuterSession);
      const res = await service.ensureOwnedSession(userId, sessionId);
      expect(res).toEqual(mockOuterSession);
    });
  });

  describe('sendMessage - Outer Chatbot', () => {
    const dto: SendAiMessageDto = { question: 'Explain quantum computing' };

    it('should route to outer_chatbot, save user & assistant messages, and return result', async () => {
      mockPrisma.chatSession.findFirst.mockResolvedValue(mockOuterSession);
      mockPrisma.chatMessage.findMany.mockResolvedValue([
        { sender: ChatSender.user, message: 'Hi' },
      ]);
      mockPrisma.chatMessage.create
        .mockResolvedValueOnce({
          id: 'msg-u',
          sender: ChatSender.user,
          message: dto.question,
        })
        .mockResolvedValueOnce({
          id: 'msg-a',
          sender: ChatSender.assistant,
          message: 'Quantum is...',
        });

      mockDispatcher.dispatch.mockResolvedValue({
        jobId: 'job-outer',
        response: 'Quantum is...',
      });

      const res = await service.sendMessage(userId, sessionId, dto);
      expect(res.answer).toBe('Quantum is...');
      expect(res.userMessage.id).toBe('msg-u');
      expect(res.assistantMessage.id).toBe('msg-a');

      expect(mockDispatcher.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'outer_chatbot',
          errorCode: 650,
          kafkaData: expect.objectContaining({
            question: dto.question,
            chat_history: [{ role: 'user', content: 'Hi' }],
            use_web_search_chatbot: true,
          }),
        }),
      );
    });
  });

  describe('sendMessage - Inner Chatbot', () => {
    const dto: SendAiMessageDto = {
      question: 'Summarize methodology from uploaded docs',
    };

    it('should throw BadRequestException if inner session lacks documentId', async () => {
      mockPrisma.chatSession.findFirst.mockResolvedValue({
        ...mockInnerSession,
        documentId: null,
      });

      await expect(service.sendMessage(userId, sessionId, dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if document has no embedded files', async () => {
      mockPrisma.chatSession.findFirst.mockResolvedValue(mockInnerSession);
      mockPrisma.userUploadedDocument.count.mockResolvedValue(0);

      await expect(service.sendMessage(userId, sessionId, dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should route to inner_chatbot with documentId and embedded docs confirmed', async () => {
      mockPrisma.chatSession.findFirst.mockResolvedValue(mockInnerSession);
      mockPrisma.userUploadedDocument.count.mockResolvedValue(2);
      mockPrisma.chatMessage.findMany.mockResolvedValue([]);
      mockPrisma.chatMessage.create
        .mockResolvedValueOnce({
          id: 'msg-u2',
          sender: ChatSender.user,
          message: dto.question,
        })
        .mockResolvedValueOnce({
          id: 'msg-a2',
          sender: ChatSender.assistant,
          message: 'Method is...',
        });

      mockDispatcher.dispatch.mockResolvedValue({
        jobId: 'job-inner',
        answer: 'Method is...',
      });

      const res = await service.sendMessage(userId, sessionId, dto);
      expect(res.answer).toBe('Method is...');
      expect(mockDispatcher.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'inner_chatbot',
          errorCode: 651,
          documentId,
        }),
      );
    });
  });

  describe('direct methods', () => {
    it('should call executeOuterChat via sendOuterChatMessage', async () => {
      mockPrisma.chatSession.findFirst.mockResolvedValue(mockOuterSession);
      mockPrisma.chatMessage.findMany.mockResolvedValue([]);
      mockPrisma.chatMessage.create.mockResolvedValue({});
      mockDispatcher.dispatch.mockResolvedValue({ text: 'Answer' });

      const res = await service.sendOuterChatMessage(userId, sessionId, {
        question: 'Test',
      });
      expect(res.answer).toBe('Answer');
    });

    it('should call executeInnerChat via sendInnerChatMessage', async () => {
      mockPrisma.chatSession.findFirst.mockResolvedValue(mockInnerSession);
      mockPrisma.userUploadedDocument.count.mockResolvedValue(1);
      mockPrisma.chatMessage.findMany.mockResolvedValue([]);
      mockPrisma.chatMessage.create.mockResolvedValue({});
      mockDispatcher.dispatch.mockResolvedValue({ message: 'Answer Inner' });

      const res = await service.sendInnerChatMessage(userId, sessionId, {
        question: 'Test',
      });
      expect(res.answer).toBe('Answer Inner');
    });
  });
});
