import { jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { JobStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import {
  ProcessStatus,
  PROCESS_STATUS_NAMES,
  toJobStatus,
  toProcessStatus,
} from '../enums/process-status.enum';
import {
  getAiErrorDetail,
  getAiErrorMessage,
  getAiErrorName,
  isAiErrorCode,
} from '../constants/ai-error-codes';
import { AiStatusMapperService } from './ai-status-mapper.service';

describe('AiStatusMapperService & Status/Error Utilities', () => {
  let service: AiStatusMapperService;
  let prismaMock: {
    job: {
      update: jest.MockedFunction<any>;
    };
  };

  beforeEach(async () => {
    prismaMock = {
      job: {
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiStatusMapperService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<AiStatusMapperService>(AiStatusMapperService);
  });

  describe('normalizeResponse', () => {
    it('should return ERROR (code 603) when message is null or not an object', () => {
      const resNull = service.normalizeResponse(null as any);
      expect(resNull.processStatus).toBe(ProcessStatus.ERROR);
      expect(resNull.errorCode).toBe(603);
      expect(resNull.errorName).toBe('INVALID_PARAMS');
      expect(resNull.statusName).toBe('ERROR');

      const resString = service.normalizeResponse('invalid' as any);
      expect(resString.processStatus).toBe(ProcessStatus.ERROR);
      expect(resString.errorCode).toBe(603);
    });

    it('should map numeric error_code to ERROR status with Vietnamese message', () => {
      const raw = {
        event_type: 'search_papers',
        error_code: 610,
        error: 'Connection reset',
        user_id: 'u-1',
      };

      const res = service.normalizeResponse(raw);
      expect(res.processStatus).toBe(ProcessStatus.ERROR);
      expect(res.statusName).toBe('ERROR');
      expect(res.errorCode).toBe(610);
      expect(res.errorName).toBe('SEARCH_PAPERS_ERROR');
      expect(res.errorMessage).toContain(
        'Lỗi khi tìm kiếm bài báo khoa học trực tuyến.',
      );
      expect(res.errorMessage).toContain('Connection reset');
      expect(res.eventType).toBe('search_papers');
    });

    it('should handle error string without error_code as 500 ERROR', () => {
      const raw = {
        error: 'Unexpected model failure',
      };

      const res = service.normalizeResponse(raw);
      expect(res.processStatus).toBe(ProcessStatus.ERROR);
      expect(res.errorCode).toBe(500);
      expect(res.errorMessage).toBe('Unexpected model failure');
    });

    it('should map done_chat: false or action_required: user_input to SUSPENDED (5)', () => {
      const rawDoneChat = {
        event_type: 'outer_chatbot',
        done_chat: false,
        response: 'Tôi cần thêm thông tin đề tài?',
      };

      const res1 = service.normalizeResponse(rawDoneChat);
      expect(res1.processStatus).toBe(ProcessStatus.SUSPENDED);
      expect(res1.statusName).toBe('SUSPENDED');
      expect(res1.hasFinished).toBe(false);
      expect(res1.doneChat).toBe(false);

      const rawActionRequired = {
        event_type: 'writer',
        action_required: 'user_input',
        data: { step: 'select_reference' },
      };

      const res2 = service.normalizeResponse(rawActionRequired);
      expect(res2.processStatus).toBe(ProcessStatus.SUSPENDED);
      expect(res2.statusName).toBe('SUSPENDED');
    });

    it('should map streaming has_finished: false to PROCESSING (2)', () => {
      const rawStreaming = {
        event_type: 'write_content',
        has_finished: false,
        data: { chunk: 'Phần mở đầu...' },
      };

      const res = service.normalizeResponse(rawStreaming);
      expect(res.processStatus).toBe(ProcessStatus.PROCESSING);
      expect(res.statusName).toBe('PROCESSING');
      expect(res.hasFinished).toBe(false);
      expect(res.data).toEqual({ chunk: 'Phần mở đầu...' });
    });

    it('should map normal completed message to FINISHED (3)', () => {
      const rawFinished = {
        event_type: 'search_papers',
        has_finished: true,
        papers: [{ title: 'Paper 1' }],
      };

      const res = service.normalizeResponse(rawFinished);
      expect(res.processStatus).toBe(ProcessStatus.FINISHED);
      expect(res.statusName).toBe('FINISHED');
      expect(res.hasFinished).toBe(true);
      expect(res.data).toEqual([{ title: 'Paper 1' }]);
    });
  });

  describe('syncJobStatus', () => {
    it('should update job table with mapped JobStatus and details', async () => {
      prismaMock.job.update.mockResolvedValue({ id: 'job-123' });

      const normalized = service.normalizeResponse({
        error_code: 429,
        error: 'Too Many Requests',
      });

      await service.syncJobStatus('job-123', normalized);

      expect(prismaMock.job.update).toHaveBeenCalledWith({
        where: { id: 'job-123' },
        data: {
          status: JobStatus.error,
          errorCode: '429',
          errorMessage: expect.stringContaining(
            'Hạn ngạch gọi mô hình AI đã vượt giới hạn',
          ),
          result: null,
        },
      });
    });

    it('should catch error and not throw when prisma update fails', async () => {
      prismaMock.job.update.mockRejectedValue(new Error('DB disconnect'));

      const normalized = service.normalizeResponse({ has_finished: true });
      await expect(
        service.syncJobStatus('job-fail', normalized),
      ).resolves.not.toThrow();
    });

    it('should skip update gracefully if prisma is not provided', async () => {
      const noPrismaService = new AiStatusMapperService(undefined);
      const normalized = noPrismaService.normalizeResponse({
        has_finished: true,
      });

      await expect(
        noPrismaService.syncJobStatus('job-any', normalized),
      ).resolves.not.toThrow();
    });
  });

  describe('Enums and Error Dictionary Utilities', () => {
    it('should map ProcessStatus to JobStatus correctly', () => {
      expect(toJobStatus(ProcessStatus.PENDING)).toBe(JobStatus.pending);
      expect(toJobStatus(ProcessStatus.PROCESSING)).toBe(JobStatus.processing);
      expect(toJobStatus(ProcessStatus.FINISHED)).toBe(JobStatus.finished);
      expect(toJobStatus(ProcessStatus.ERROR)).toBe(JobStatus.error);
      expect(toJobStatus(ProcessStatus.SUSPENDED)).toBe(JobStatus.suspended);
      expect(toJobStatus(999 as any)).toBe(JobStatus.pending);
    });

    it('should map JobStatus to ProcessStatus correctly', () => {
      expect(toProcessStatus(JobStatus.pending)).toBe(ProcessStatus.PENDING);
      expect(toProcessStatus(JobStatus.processing)).toBe(
        ProcessStatus.PROCESSING,
      );
      expect(toProcessStatus(JobStatus.finished)).toBe(ProcessStatus.FINISHED);
      expect(toProcessStatus(JobStatus.error)).toBe(ProcessStatus.ERROR);
      expect(toProcessStatus(JobStatus.suspended)).toBe(
        ProcessStatus.SUSPENDED,
      );
      expect(toProcessStatus('unknown' as any)).toBe(ProcessStatus.PENDING);
    });

    it('should verify PROCESS_STATUS_NAMES mapping', () => {
      expect(PROCESS_STATUS_NAMES[ProcessStatus.PENDING]).toBe('PENDING');
      expect(PROCESS_STATUS_NAMES[ProcessStatus.FINISHED]).toBe('FINISHED');
    });

    it('should look up known AI errors correctly', () => {
      expect(isAiErrorCode(610)).toBe(true);
      expect(getAiErrorName(610)).toBe('SEARCH_PAPERS_ERROR');
      expect(getAiErrorMessage(610)).toContain('tìm kiếm bài báo khoa học');

      expect(isAiErrorCode(401)).toBe(true);
      expect(getAiErrorName(401)).toBe('LLM_AUTHENTICATION_ERROR');
    });

    it('should handle unknown error codes gracefully', () => {
      expect(isAiErrorCode(9999)).toBe(false);
      const detail = getAiErrorDetail(9999);
      expect(detail.name).toBe('AI_UNKNOWN_ERROR');
      expect(detail.message).toContain('9999');
    });
  });
});
