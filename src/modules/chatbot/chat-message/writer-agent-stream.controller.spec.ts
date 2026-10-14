import { jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { of } from 'rxjs';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { WriterAgentStreamController } from './writer-agent-stream.controller';
import { WriterInteractiveAiService } from './writer-interactive-ai.service';
import {
  ResumeWriterAgentDto,
  StartWriterAgentDto,
  WriterChatbotDto,
} from './dto/writer-chatbot.dto';

describe('WriterAgentStreamController', () => {
  let controller: WriterAgentStreamController;
  let mockWriterService: Record<string, any>;

  const userId = '00000000-0000-0000-0000-000000000001';
  const sessionId = '00000000-0000-0000-0000-000000000002';

  beforeEach(async () => {
    mockWriterService = {
      interactWriterChatbot: jest.fn<any>(),
      startWriterAgent: jest.fn<any>(),
      getWriterStream: jest.fn<any>(),
      resumeWriterAgent: jest.fn<any>(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [WriterAgentStreamController],
      providers: [
        { provide: WriterInteractiveAiService, useValue: mockWriterService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<WriterAgentStreamController>(
      WriterAgentStreamController,
    );
  });

  it('should delegate interactWriterChatbot to writerService', async () => {
    const dto: WriterChatbotDto = { question: 'Clarify scope' };
    mockWriterService.interactWriterChatbot.mockResolvedValue({
      doneChat: false,
    });

    const res = await controller.interactWriterChatbot(userId, sessionId, dto);
    expect(res).toEqual({ doneChat: false });
    expect(mockWriterService.interactWriterChatbot).toHaveBeenCalledWith(
      userId,
      sessionId,
      dto,
    );
  });

  it('should delegate startWriterAgent to writerService', async () => {
    const dto: StartWriterAgentDto = { instruction: 'Write intro' };
    mockWriterService.startWriterAgent.mockResolvedValue({ status: 'started' });

    const res = await controller.startWriterAgent(userId, sessionId, dto);
    expect(res).toEqual({ status: 'started' });
    expect(mockWriterService.startWriterAgent).toHaveBeenCalledWith(
      userId,
      sessionId,
      dto,
    );
  });

  it('should delegate streamWriter to writerService', () => {
    mockWriterService.getWriterStream.mockReturnValue(of({ data: 'chunk' }));

    const res = controller.streamWriter(userId, sessionId);
    expect(res).toBeDefined();
    expect(mockWriterService.getWriterStream).toHaveBeenCalledWith(
      userId,
      sessionId,
    );
  });

  it('should delegate resumeWriterAgent to writerService', async () => {
    const dto: ResumeWriterAgentDto = { userInput: 'Proceed' };
    mockWriterService.resumeWriterAgent.mockResolvedValue({ success: true });

    const res = await controller.resumeWriterAgent(userId, sessionId, dto);
    expect(res).toEqual({ success: true });
    expect(mockWriterService.resumeWriterAgent).toHaveBeenCalledWith(
      userId,
      sessionId,
      dto,
    );
  });
});
