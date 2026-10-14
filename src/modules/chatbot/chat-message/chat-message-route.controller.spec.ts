import { jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { ChatMessageRouteController } from './chat-message-route.controller';
import { ChatMessageService } from './chat-message.service';
import { ChatbotAiService } from './chatbot-ai.service';
import { CreateNestedChatMessageDto } from './dto/create-nested-chat-message.dto';
import { UpdateChatMessageDto } from './dto/update-chat-message.dto';
import { SendAiMessageDto } from './dto/send-ai-message.dto';

describe('ChatMessageRouteController', () => {
  let controller: ChatMessageRouteController;
  let mockService: Record<string, any>;
  let mockAiService: Record<string, any>;

  const userId = '00000000-0000-0000-0000-000000000001';
  const sessionId = '00000000-0000-0000-0000-000000000002';
  const messageId = '00000000-0000-0000-0000-000000000003';

  beforeEach(async () => {
    mockService = {
      createForSession: jest.fn<any>(),
      findAll: jest.fn<any>(),
      findOne: jest.fn<any>(),
      update: jest.fn<any>(),
      remove: jest.fn<any>(),
    };

    mockAiService = {
      sendMessage: jest.fn<any>(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChatMessageRouteController],
      providers: [
        { provide: ChatMessageService, useValue: mockService },
        { provide: ChatbotAiService, useValue: mockAiService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ChatMessageRouteController>(
      ChatMessageRouteController,
    );
  });

  describe('sendAiMessage', () => {
    it('should delegate to aiService.sendMessage', async () => {
      const dto: SendAiMessageDto = { question: 'Hello AI' };
      mockAiService.sendMessage.mockResolvedValue({ answer: 'Hello human' });

      const res = await controller.sendAiMessage(userId, sessionId, dto);
      expect(res).toEqual({ answer: 'Hello human' });
      expect(mockAiService.sendMessage).toHaveBeenCalledWith(
        userId,
        sessionId,
        dto,
      );
    });
  });

  describe('CRUD Endpoints', () => {
    it('should delegate create to service.createForSession', async () => {
      const dto: CreateNestedChatMessageDto = { message: 'Hi' } as any;
      mockService.createForSession.mockResolvedValue({ id: messageId });

      const res = await controller.create(userId, sessionId, dto);
      expect(res).toEqual({ id: messageId });
      expect(mockService.createForSession).toHaveBeenCalledWith(
        userId,
        sessionId,
        dto,
      );
    });

    it('should delegate findAll to service', async () => {
      mockService.findAll.mockResolvedValue([{ id: messageId }]);

      const res = await controller.findAll(userId, sessionId);
      expect(res).toHaveLength(1);
      expect(mockService.findAll).toHaveBeenCalledWith(userId, sessionId);
    });

    it('should delegate findOne to service', async () => {
      mockService.findOne.mockResolvedValue({ id: messageId });

      const res = await controller.findOne(userId, messageId);
      expect(res).toEqual({ id: messageId });
      expect(mockService.findOne).toHaveBeenCalledWith(userId, messageId);
    });

    it('should delegate update to service', async () => {
      const dto: UpdateChatMessageDto = { message: 'Updated' };
      mockService.update.mockResolvedValue({
        id: messageId,
        message: 'Updated',
      });

      const res = await controller.update(userId, messageId, dto);
      expect(res.message).toBe('Updated');
      expect(mockService.update).toHaveBeenCalledWith(userId, messageId, dto);
    });

    it('should delegate remove to service', async () => {
      mockService.remove.mockResolvedValue({ deleted: true });

      const res = await controller.remove(userId, messageId);
      expect(res).toEqual({ deleted: true });
      expect(mockService.remove).toHaveBeenCalledWith(userId, messageId);
    });
  });
});
