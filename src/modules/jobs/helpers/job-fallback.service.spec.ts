import { jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { JobFallbackService } from './job-fallback.service';
import { PrismaService } from '../../../database/prisma.service';

describe('JobFallbackService', () => {
  let service: JobFallbackService;
  // Test double của PrismaService: chỉ cần `job.update`
  let prismaMock: Record<string, any>;
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(async () => {
    prismaMock = {
      job: {
        update: jest.fn(() =>
          Promise.resolve({ id: 'job-1', status: 'finished' }),
        ),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobFallbackService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<JobFallbackService>(JobFallbackService);
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('ném lỗi và KHÔNG ghi DB khi NODE_ENV=production', async () => {
    process.env.NODE_ENV = 'production';

    await expect(
      service.processJobFallback({ id: 'job-1', module: 'unknown_action' }),
    ).rejects.toThrow(/bị chặn ở production/);

    expect(prismaMock.job.update).not.toHaveBeenCalled();
  });

  it('vẫn chạy fallback ở môi trường dev/test', async () => {
    process.env.NODE_ENV = 'test';

    const result = await service.processJobFallback({
      id: 'job-1',
      module: 'chatbot',
      action: 'outer_chatbot',
    });

    expect(prismaMock.job.update).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ id: 'job-1', status: 'finished' });
  });
});
