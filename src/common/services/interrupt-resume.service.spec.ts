import { jest } from '@jest/globals';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { JobStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { JobsKafkaProducer } from '../../modules/jobs/kafka/jobs-kafka.producer';
import {
  InterruptResumeService,
  isInterruptibleEvent,
} from './interrupt-resume.service';

describe('InterruptResumeService', () => {
  let service: InterruptResumeService;
  let prismaMock: {
    job: {
      findUnique: jest.MockedFunction<any>;
      update: jest.MockedFunction<any>;
    };
  };
  let kafkaProducerMock: {
    publishJob: jest.MockedFunction<any>;
  };
  let configServiceMock: {
    get: jest.MockedFunction<any>;
  };

  beforeEach(async () => {
    prismaMock = {
      job: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };

    kafkaProducerMock = {
      publishJob: jest.fn().mockResolvedValue(undefined as never),
    };

    configServiceMock = {
      get: jest.fn<any>().mockImplementation((key: any, defaultVal: any) => {
        if (key === 'KAFKA_ENABLED') return 'true';
        return defaultVal;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InterruptResumeService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: JobsKafkaProducer, useValue: kafkaProducerMock },
        { provide: ConfigService, useValue: configServiceMock },
      ],
    }).compile();

    service = module.get<InterruptResumeService>(InterruptResumeService);
  });

  describe('isInterruptibleEvent & isSuspendedPayload', () => {
    it('should correctly detect interruptible events', () => {
      expect(isInterruptibleEvent('writer_chatbot')).toBe(true);
      expect(isInterruptibleEvent('propose_method')).toBe(true);
      expect(isInterruptibleEvent('writer')).toBe(true);
      expect(isInterruptibleEvent('search_papers')).toBe(false);
    });

    it('should detect suspend condition on done_chat: false or action_required', () => {
      expect(service.isSuspendedPayload({ done_chat: false })).toBe(true);
      expect(
        service.isSuspendedPayload({ action_required: 'user_input' }),
      ).toBe(true);
    });

    it('should detect suspend condition for interruptible events with has_finished: false', () => {
      expect(
        service.isSuspendedPayload({ has_finished: false }, 'writer_chatbot'),
      ).toBe(true);
      expect(
        service.isSuspendedPayload({ has_finished: false }, 'search_papers'),
      ).toBe(false);
    });

    it('should return false for completed payload', () => {
      expect(
        service.isSuspendedPayload({ has_finished: true, done_chat: true }),
      ).toBe(false);
    });
  });

  describe('suspendJob', () => {
    it('should update job status to suspended with resume step', async () => {
      prismaMock.job.update.mockResolvedValue({ id: 'job-1' });

      await service.suspendJob(
        'job-1',
        { action_required: 'confirm_outline', data: { prompt: 'OK?' } },
        'confirm_step',
      );

      expect(prismaMock.job.update).toHaveBeenCalledWith({
        where: { id: 'job-1' },
        data: {
          status: JobStatus.suspended,
          resumeStep: 'confirm_step',
          result: { prompt: 'OK?' },
        },
      });
    });
  });

  describe('resumeJob', () => {
    it('should throw NotFoundException if job does not exist', async () => {
      prismaMock.job.findUnique.mockResolvedValue(null);

      await expect(
        service.resumeJob('job-missing', 'user text'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if job is not suspended', async () => {
      prismaMock.job.findUnique.mockResolvedValue({
        id: 'job-pending',
        status: JobStatus.pending,
      });

      await expect(
        service.resumeJob('job-pending', 'user text'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should resume suspended job, switch status to pending, and republish to Kafka', async () => {
      const existingJob = {
        id: 'job-sus',
        status: JobStatus.suspended,
        resumeStep: 'select_domain',
        payload: { field: 'Finance' },
      };

      prismaMock.job.findUnique.mockResolvedValue(existingJob);
      prismaMock.job.update.mockResolvedValue({
        ...existingJob,
        status: JobStatus.pending,
        resumeStep: 'domain_confirmed',
      });

      const res = await service.resumeJob(
        'job-sus',
        { selected: 'Fintech' },
        'domain_confirmed',
      );

      expect(res.status).toBe(JobStatus.pending);
      expect(res.resumeStep).toBe('domain_confirmed');
      expect(prismaMock.job.update).toHaveBeenCalledWith({
        where: { id: 'job-sus' },
        data: {
          status: JobStatus.pending,
          resumeStep: 'domain_confirmed',
          payload: expect.objectContaining({
            field: 'Finance',
            resume: true,
            user_input: { selected: 'Fintech' },
          }),
          errorCode: null,
          errorMessage: null,
        },
      });
      expect(kafkaProducerMock.publishJob).toHaveBeenCalled();
    });
  });
});
