import { jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { ChatSender } from '@prisma/client';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { ChatMessageController } from './chat-message.controller';
import { ChatMessageService } from './chat-message.service';
import { CreateChatMessageDto } from './dto/create-chat-message.dto';
import { UpdateChatMessageDto } from './dto/update-chat-message.dto';

describe('ChatMessageController', () => {
  let controller: ChatMessageController;
  let mockService: Record<string, any>;

  const userId = '00000000-0000-0000-0000-000000000001';
  const sessionId = '00000000-0000-0000-0000-000000000002';
  const messageId = '00000000-0000-0000-0000-000000000003';

  beforeEach(async () => {
    mockService = {
      create: jest.fn<any>(),
      findAll: jest.fn<any>(),
      findOne: jest.fn<any>(),
      update: jest.fn<any>(),
      remove: jest.fn<any>(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChatMessageController],
      providers: [{ provide: ChatMessageService, useValue: mockService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ChatMessageController>(ChatMessageController);
  });

  it('should delegate create to service', async () => {
    const dto: CreateChatMessageDto = {
      sessionId,
      sender: ChatSender.user,
      message: 'Hi',
    };
    mockService.create.mockResolvedValue({ id: messageId });

    const res = await controller.create(userId, dto);
    expect(res).toEqual({ id: messageId });
    expect(mockService.create).toHaveBeenCalledWith(userId, dto);
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
    mockService.update.mockResolvedValue({ id: messageId });

    const res = await controller.update(userId, messageId, dto);
    expect(res).toEqual({ id: messageId });
    expect(mockService.update).toHaveBeenCalledWith(userId, messageId, dto);
  });

  it('should delegate remove to service', async () => {
    mockService.remove.mockResolvedValue({ deleted: true });

    const res = await controller.remove(userId, messageId);
    expect(res).toEqual({ deleted: true });
    expect(mockService.remove).toHaveBeenCalledWith(userId, messageId);
  });
});
