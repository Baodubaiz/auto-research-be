import { jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HealthCheckController } from './health-check.controller';
import { HealthCheckService } from './health-check.service';
import { HealthCheckWebhookDto } from './dto/health-check-webhook.dto';

describe('HealthCheckController', () => {
  let controller: HealthCheckController;
  let service: HealthCheckService;

  const mockService = {
    handleHeartbeat: jest.fn().mockResolvedValue({
      success: true,
      message: 'Heartbeat and status synchronized successfully',
      data: { id: 'doc-123', eventType: 'write_content', processStatus: 2 },
    }),
    getStatus: jest.fn().mockResolvedValue({
      eventType: 'write_content',
      processStatus: 2,
      aiError: null,
    }),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('test-api-key'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthCheckController],
      providers: [
        { provide: HealthCheckService, useValue: mockService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    controller = module.get<HealthCheckController>(HealthCheckController);
    service = module.get<HealthCheckService>(HealthCheckService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call handleHeartbeat on PUT /health-check/:id', async () => {
    const dto: HealthCheckWebhookDto = {
      eventType: 'write_content',
      processStatus: 2,
      aiError: null,
    };

    const res = await controller.handleWebhook('doc-123', dto);

    expect(res.success).toBe(true);
    expect(service.handleHeartbeat).toHaveBeenCalledWith('doc-123', dto);
  });

  it('should return status on GET /health-check/:id', async () => {
    const res = await controller.getStatus('doc-123');
    expect(res.id).toBe('doc-123');
    expect(res.status.processStatus).toBe(2);
    expect(service.getStatus).toHaveBeenCalledWith('doc-123');
  });

  it('should return default status if not found on GET /health-check/:id', async () => {
    (mockService.getStatus as jest.Mock).mockResolvedValueOnce(null);
    const res = await controller.getStatus('doc-unknown');
    expect(res.status.processStatus).toBe(1);
    expect(res.status.eventType).toBe('unknown');
  });
});
