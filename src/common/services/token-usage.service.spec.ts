import { jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { TokenUsageService } from './token-usage.service';
import { PrismaService } from '../../database/prisma.service';

describe('TokenUsageService', () => {
  let service: TokenUsageService;
  let mockPrisma: {
    tokenUsage: {
      create: jest.MockedFunction<any>;
      aggregate: jest.MockedFunction<any>;
      findMany: jest.MockedFunction<any>;
    };
  };

  beforeEach(async () => {
    mockPrisma = {
      tokenUsage: {
        create: jest.fn(),
        aggregate: jest.fn(),
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenUsageService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<TokenUsageService>(TokenUsageService);
  });

  describe('recordUsage', () => {
    it('should ignore if userId is empty', async () => {
      await service.recordUsage({
        userId: '',
        eventType: 'test',
        inputTokens: 10,
      });

      expect(mockPrisma.tokenUsage.create).not.toHaveBeenCalled();
    });

    it('should ignore if all tokens and calls are zero', async () => {
      await service.recordUsage({
        userId: 'user-1',
        eventType: 'test',
        inputTokens: 0,
        outputTokens: 0,
        embedTokens: 0,
        webSearchCall: 0,
      });

      expect(mockPrisma.tokenUsage.create).not.toHaveBeenCalled();
    });

    it('should successfully create token usage record', async () => {
      mockPrisma.tokenUsage.create.mockResolvedValue({ id: 'tu-1' });

      await service.recordUsage({
        userId: 'user-1',
        documentId: 'doc-1',
        convId: 'conv-1',
        sessionId: 'sess-1',
        eventType: 'write_content',
        modelId: 'gpt-4o',
        inputTokens: 100,
        outputTokens: 50,
        embedTokens: 20,
        embedModel: 'text-embedding-3',
        webSearchCall: 2,
      });

      expect(mockPrisma.tokenUsage.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          documentId: 'doc-1',
          convId: 'conv-1',
          sessionId: 'sess-1',
          eventType: 'write_content',
          modelId: 'gpt-4o',
          inputTokens: 100,
          outputTokens: 50,
          embedTokens: 20,
          embedModel: 'text-embedding-3',
          webSearchCall: 2,
        },
      });
    });

    it('should fallback without documentId if initial create fails with documentId', async () => {
      mockPrisma.tokenUsage.create
        .mockRejectedValueOnce(new Error('Foreign key violation on document_id'))
        .mockResolvedValueOnce({ id: 'tu-fallback' });

      await service.recordUsage({
        userId: 'user-1',
        documentId: 'invalid-doc',
        eventType: 'search_papers',
        inputTokens: 30,
      });

      expect(mockPrisma.tokenUsage.create).toHaveBeenCalledTimes(2);
      expect(mockPrisma.tokenUsage.create).toHaveBeenLastCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user-1',
            documentId: null,
            inputTokens: 30,
          }),
        }),
      );
    });

    it('should catch error safely without throwing if fallback also fails', async () => {
      mockPrisma.tokenUsage.create
        .mockRejectedValueOnce(new Error('FK violation'))
        .mockRejectedValueOnce(new Error('DB connection error'));

      await expect(
        service.recordUsage({
          userId: 'user-1',
          documentId: 'doc-1',
          eventType: 'test',
          inputTokens: 10,
        }),
      ).resolves.not.toThrow();
    });

    it('should catch error safely without throwing if error occurs without documentId', async () => {
      mockPrisma.tokenUsage.create.mockRejectedValue(new Error('DB failure'));

      await expect(
        service.recordUsage({
          userId: 'user-1',
          eventType: 'test',
          inputTokens: 10,
        }),
      ).resolves.not.toThrow();
    });
  });

  describe('extractUsageFromPayload', () => {
    it('should return null for invalid payload', () => {
      expect(service.extractUsageFromPayload(null as any)).toBeNull();
      expect(service.extractUsageFromPayload(undefined as any)).toBeNull();
      expect(service.extractUsageFromPayload({} as any)).toBeNull();
    });

    it('should extract usage from snake_case top-level fields', () => {
      const payload = {
        user_id: 'user-1',
        document_id: 'doc-1',
        conv_id: 'conv-1',
        session_id: 'sess-1',
        event_type: 'generate_outline',
        model_id: 'claude-3-5',
        input_tokens: 150,
        output_tokens: 80,
        embed_tokens: 40,
        embed_model: 'bge-large',
        web_search_call: 3,
      };

      const result = service.extractUsageFromPayload(payload);
      expect(result).toEqual({
        userId: 'user-1',
        documentId: 'doc-1',
        convId: 'conv-1',
        sessionId: 'sess-1',
        eventType: 'generate_outline',
        modelId: 'claude-3-5',
        inputTokens: 150,
        outputTokens: 80,
        embedTokens: 40,
        embedModel: 'bge-large',
        webSearchCall: 3,
      });
    });

    it('should extract usage from camelCase top-level fields', () => {
      const payload = {
        userId: 'user-2',
        documentId: 'doc-2',
        convId: 'conv-2',
        sessionId: 'sess-2',
        eventType: 'write_section',
        modelId: 'gpt-4o-mini',
        inputTokens: 200,
        outputTokens: 100,
        embedTokens: 10,
        embedModel: 'text-embed',
        webSearchCall: 1,
      };

      const result = service.extractUsageFromPayload(payload);
      expect(result).toEqual({
        userId: 'user-2',
        documentId: 'doc-2',
        convId: 'conv-2',
        sessionId: 'sess-2',
        eventType: 'write_section',
        modelId: 'gpt-4o-mini',
        inputTokens: 200,
        outputTokens: 100,
        embedTokens: 10,
        embedModel: 'text-embed',
        webSearchCall: 1,
      });
    });

    it('should extract usage from nested token_usage or usage object', () => {
      const payload = {
        user_id: 'user-3',
        event_type: 'chatbot',
        token_usage: {
          input_tokens: 50,
          output_tokens: 60,
          embed_tokens: 15,
          embed_model: 'custom-embed',
          web_search_call: 2,
          model_id: 'deepseek-chat',
        },
      };

      const result = service.extractUsageFromPayload(payload);
      expect(result).toEqual({
        userId: 'user-3',
        documentId: undefined,
        convId: undefined,
        sessionId: undefined,
        eventType: 'chatbot',
        modelId: 'deepseek-chat',
        inputTokens: 50,
        outputTokens: 60,
        embedTokens: 15,
        embedModel: 'custom-embed',
        webSearchCall: 2,
      });
    });
  });

  describe('recordUsageFromPayload', () => {
    it('should extract and record usage', async () => {
      const spy = jest.spyOn(service, 'recordUsage').mockResolvedValue(undefined);

      await service.recordUsageFromPayload({
        user_id: 'user-1',
        event_type: 'test',
        input_tokens: 12,
      });

      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          eventType: 'test',
          inputTokens: 12,
        }),
      );
    });

    it('should not call recordUsage if payload has no user', async () => {
      const spy = jest.spyOn(service, 'recordUsage').mockResolvedValue(undefined);

      await service.recordUsageFromPayload({
        event_type: 'test',
        input_tokens: 12,
      });

      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('getUserSummary', () => {
    it('should return aggregated user summary', async () => {
      mockPrisma.tokenUsage.aggregate.mockResolvedValue({
        _sum: {
          inputTokens: 500,
          outputTokens: 250,
          embedTokens: 100,
          webSearchCall: 5,
        },
        _count: {
          id: 10,
        },
      });

      const summary = await service.getUserSummary('user-1');

      expect(mockPrisma.tokenUsage.aggregate).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        _sum: {
          inputTokens: true,
          outputTokens: true,
          embedTokens: true,
          webSearchCall: true,
        },
        _count: {
          id: true,
        },
      });

      expect(summary).toEqual({
        userId: 'user-1',
        totalInputTokens: 500,
        totalOutputTokens: 250,
        totalEmbedTokens: 100,
        totalWebSearchCalls: 5,
        totalRequests: 10,
      });
    });

    it('should default null aggregate sums to 0', async () => {
      mockPrisma.tokenUsage.aggregate.mockResolvedValue({
        _sum: {
          inputTokens: null,
          outputTokens: null,
          embedTokens: null,
          webSearchCall: null,
        },
        _count: {
          id: 0,
        },
      });

      const summary = await service.getUserSummary('user-empty');

      expect(summary).toEqual({
        userId: 'user-empty',
        totalInputTokens: 0,
        totalOutputTokens: 0,
        totalEmbedTokens: 0,
        totalWebSearchCalls: 0,
        totalRequests: 0,
      });
    });
  });

  describe('getDocumentSummary', () => {
    it('should return aggregated document summary', async () => {
      mockPrisma.tokenUsage.aggregate.mockResolvedValue({
        _sum: {
          inputTokens: 1000,
          outputTokens: 400,
          embedTokens: 200,
          webSearchCall: 8,
        },
        _count: {
          id: 15,
        },
      });

      const summary = await service.getDocumentSummary('doc-1');

      expect(mockPrisma.tokenUsage.aggregate).toHaveBeenCalledWith({
        where: { documentId: 'doc-1' },
        _sum: {
          inputTokens: true,
          outputTokens: true,
          embedTokens: true,
          webSearchCall: true,
        },
        _count: {
          id: true,
        },
      });

      expect(summary).toEqual({
        documentId: 'doc-1',
        totalInputTokens: 1000,
        totalOutputTokens: 400,
        totalEmbedTokens: 200,
        totalWebSearchCalls: 8,
        totalRequests: 15,
      });
    });
  });
});
