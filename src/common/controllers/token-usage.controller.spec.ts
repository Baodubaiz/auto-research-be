import { jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { TokenUsageController } from './token-usage.controller';
import { TokenUsageService } from '../services/token-usage.service';

describe('TokenUsageController', () => {
  let controller: TokenUsageController;
  let mockTokenUsageService: {
    getUserSummary: jest.MockedFunction<any>;
    getDocumentSummary: jest.MockedFunction<any>;
  };

  beforeEach(async () => {
    mockTokenUsageService = {
      getUserSummary: jest.fn(),
      getDocumentSummary: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TokenUsageController],
      providers: [
        {
          provide: TokenUsageService,
          useValue: mockTokenUsageService,
        },
      ],
    }).compile();

    controller = module.get<TokenUsageController>(TokenUsageController);
  });

  it('should call getUserSummary', async () => {
    const expected = {
      userId: 'user-1',
      totalInputTokens: 100,
      totalOutputTokens: 50,
      totalEmbedTokens: 20,
      totalWebSearchCalls: 2,
      totalRequests: 5,
    };
    mockTokenUsageService.getUserSummary.mockResolvedValue(expected);

    const result = await controller.getUserSummary('user-1');
    expect(mockTokenUsageService.getUserSummary).toHaveBeenCalledWith('user-1');
    expect(result).toEqual(expected);
  });

  it('should call getDocumentSummary', async () => {
    const expected = {
      documentId: 'doc-1',
      totalInputTokens: 200,
      totalOutputTokens: 100,
      totalEmbedTokens: 40,
      totalWebSearchCalls: 4,
      totalRequests: 8,
    };
    mockTokenUsageService.getDocumentSummary.mockResolvedValue(expected);

    const result = await controller.getDocumentSummary('doc-1');
    expect(mockTokenUsageService.getDocumentSummary).toHaveBeenCalledWith(
      'doc-1',
    );
    expect(result).toEqual(expected);
  });
});
