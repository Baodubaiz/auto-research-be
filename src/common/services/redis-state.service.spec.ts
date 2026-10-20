import { jest } from '@jest/globals';
import { ConfigService } from '@nestjs/config';
import { RedisStateService } from './redis-state.service';
import { HealthCheckWebhookDto } from '../../modules/health-check/dto/health-check-webhook.dto';

describe('RedisStateService', () => {
  let service: RedisStateService;
  let configService: ConfigService;

  describe('When redis is disabled (fallback mode)', () => {
    beforeEach(async () => {
      configService = {
        get: jest.fn().mockImplementation((key: string, defaultValue?: any) => {
          if (key === 'redis.enabled') return false;
          if (key === 'redis.url') return 'redis://localhost:6379';
          return defaultValue;
        }),
      } as unknown as ConfigService;

      service = new RedisStateService(configService);
      await service.onModuleInit();
    });

    afterEach(async () => {
      await service.onModuleDestroy();
    });

    it('should store and retrieve AI status in in-memory fallback', async () => {
      const dto: HealthCheckWebhookDto = {
        eventType: 'write_content',
        processStatus: 2,
        aiError: {
          errorCode: null,
          error: null,
        },
      };

      await service.setAiStatus('doc-123', dto);
      const status = await service.getAiStatus('doc-123');

      expect(status).toBeDefined();
      expect(status?.eventType).toBe('write_content');
      expect(status?.processStatus).toBe(2);
      expect(status?.aiError.errorCode).toBeNull();
    });

    it('should return null when AI status does not exist', async () => {
      const status = await service.getAiStatus('non-existent');
      expect(status).toBeNull();
    });

    it('should store and retrieve AI keys', async () => {
      await service.setAiKey('gpt-4o', 'sk-test-key');
      const key = await service.getAiKey('gpt-4o');
      expect(key).toBe('sk-test-key');
    });

    it('should store db_key and search_web_key', async () => {
      await service.setDbKey('db-secret');
      await service.setSearchWebKey('search-secret');

      expect(await service.getAiKey('db_key')).toBe('db-secret');
      expect(await service.getAiKey('search_web_key')).toBe('search-secret');
    });
  });

  describe('When redis client mock is active', () => {
    let mockClient: any;

    beforeEach(async () => {
      mockClient = {
        connect: jest.fn().mockResolvedValue(undefined),
        quit: jest.fn().mockResolvedValue(undefined),
        disconnect: jest.fn(),
        set: jest.fn().mockResolvedValue('OK'),
        get: jest.fn().mockResolvedValue(
          JSON.stringify({
            eventType: 'search_papers',
            processStatus: 3,
            aiError: { errorCode: null, error: null },
          }),
        ),
      };

      configService = {
        get: jest.fn().mockReturnValue(false),
      } as unknown as ConfigService;

      service = new RedisStateService(configService);
      (service as any).rawClient = mockClient;
    });

    it('should use rawClient to set and get status', async () => {
      const dto: HealthCheckWebhookDto = {
        eventType: 'search_papers',
        processStatus: 3,
        aiError: null,
      };

      await service.setAiStatus('doc-456', dto);
      expect(mockClient.set).toHaveBeenCalled();

      const status = await service.getAiStatus('doc-456');
      expect(mockClient.get).toHaveBeenCalledWith('AI_STATUS:doc-456');
      expect(status?.eventType).toBe('search_papers');
    });

    it('should handle redis errors gracefully and fallback to in-memory', async () => {
      mockClient.set.mockRejectedValueOnce(new Error('Redis connection drop'));
      mockClient.get.mockRejectedValueOnce(new Error('Redis connection drop'));

      const dto: HealthCheckWebhookDto = {
        eventType: 'fallback_event',
        processStatus: 2,
        aiError: null,
      };

      await service.setAiStatus('doc-error', dto);
      const status = await service.getAiStatus('doc-error');
      expect(status?.eventType).toBe('fallback_event');
    });

    it('should use rawClient to set and get AI keys', async () => {
      mockClient.get.mockResolvedValueOnce('sk-from-redis');
      await service.setAiKey('model-test', 'sk-from-redis');
      expect(mockClient.set).toHaveBeenCalledWith('AI_KEY:model-test', 'sk-from-redis');

      const val = await service.getAiKey('model-test');
      expect(val).toBe('sk-from-redis');
    });
  });
});
