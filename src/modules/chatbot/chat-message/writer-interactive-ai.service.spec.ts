import { jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { WriterInteractiveAiService } from './writer-interactive-ai.service';
import { WriterChatbotService } from './writer-chatbot.service';
import { WriterAgentService } from './writer-agent.service';
import {
  ResumeWriterAgentDto,
  StartWriterAgentDto,
  WriterChatbotDto,
} from './dto/writer-chatbot.dto';

describe('WriterInteractiveAiService', () => {
  let service: WriterInteractiveAiService;
  let mockChatbotService: any;
  let mockAgentService: any;

  beforeEach(async () => {
    mockChatbotService = {
      interactWriterChatbot: jest
        .fn<any>()
        .mockResolvedValue({ doneChat: true }),
    };
    mockAgentService = {
      startWriterAgent: jest.fn<any>().mockResolvedValue({ status: 'started' }),
      getWriterStream: jest.fn<any>().mockReturnValue('mock-stream'),
      resumeWriterAgent: jest.fn<any>().mockResolvedValue({ success: true }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WriterInteractiveAiService,
        { provide: WriterChatbotService, useValue: mockChatbotService },
        { provide: WriterAgentService, useValue: mockAgentService },
      ],
    }).compile();

    service = module.get<WriterInteractiveAiService>(
      WriterInteractiveAiService,
    );
  });

  it('should delegate interactWriterChatbot to WriterChatbotService', async () => {
    const dto: WriterChatbotDto = { question: 'test' };
    const res = await service.interactWriterChatbot('u1', 's1', dto);
    expect(res).toEqual({ doneChat: true });
    expect(mockChatbotService.interactWriterChatbot).toHaveBeenCalledWith(
      'u1',
      's1',
      dto,
    );
  });

  it('should delegate startWriterAgent to WriterAgentService', async () => {
    const dto: StartWriterAgentDto = { instruction: 'test' };
    const res = await service.startWriterAgent('u1', 's1', dto);
    expect(res).toEqual({ status: 'started' });
    expect(mockAgentService.startWriterAgent).toHaveBeenCalledWith(
      'u1',
      's1',
      dto,
    );
  });

  it('should delegate getWriterStream to WriterAgentService', () => {
    const res = service.getWriterStream('u1', 's1');
    expect(res).toBe('mock-stream');
    expect(mockAgentService.getWriterStream).toHaveBeenCalledWith('u1', 's1');
  });

  it('should delegate resumeWriterAgent to WriterAgentService', async () => {
    const dto: ResumeWriterAgentDto = { userInput: 'next' };
    const res = await service.resumeWriterAgent('u1', 's1', dto);
    expect(res).toEqual({ success: true });
    expect(mockAgentService.resumeWriterAgent).toHaveBeenCalledWith(
      'u1',
      's1',
      dto,
    );
  });
});
