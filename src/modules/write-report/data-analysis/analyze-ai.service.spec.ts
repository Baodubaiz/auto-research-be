import { jest } from '@jest/globals';
import { NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../../database/prisma.service';
import { KafkaProducerService } from '../../../messaging/kafka-producer.service';
import { RequestCorrelationService } from '../../../messaging/request-correlation.service';
import { AnalyzeAiService } from './analyze-ai.service';

const body = {
  finalProposal: { title: 'Đề tài A' },
  data: { age: [22, 35], income: [10, 20] },
  variables: [
    {
      name: 'Tuổi',
      code: 'age',
      variable_type: 'observed',
      role: 'independent',
      scale: 'ratio',
    },
  ],
};

describe('AnalyzeAiService', () => {
  let service: AnalyzeAiService;
  let prismaMock: Record<string, any>;
  let producerMock: Record<string, any>;
  let correlationMock: Record<string, any>;
  let pendingResponse: Record<string, unknown>;

  beforeEach(async () => {
    pendingResponse = { has_finished: true, result_html: 'http://minio/report.html' };

    prismaMock = {
      dataset: {
        findFirst: jest.fn(() =>
          Promise.resolve({ id: 'ds-1', documentId: 'doc-1' }),
        ),
      },
      job: {
        create: jest.fn(() => Promise.resolve({ id: 'job-1' })),
        update: jest.fn(() => Promise.resolve({})),
      },
    };
    producerMock = { publish: jest.fn(() => Promise.resolve()) };
    correlationMock = {
      buildCorrelationKey: jest.fn(() => 'key-1'),
      registerPending: jest.fn(() => Promise.resolve(pendingResponse)),
      clearPending: jest.fn(),
    };
    const configMock = { get: jest.fn(() => 'write_section_request_local') };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyzeAiService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: KafkaProducerService, useValue: producerMock },
        { provide: RequestCorrelationService, useValue: correlationMock },
        { provide: ConfigService, useValue: configMock },
      ],
    }).compile();

    service = module.get<AnalyzeAiService>(AnalyzeAiService);
  });

  it('analyzer: mode mặc định auto_plan/auto_action=true, manual=false, db=redis', async () => {
    await service.analyze('user-1', 'ds-1', body as any);

    const payload = producerMock.publish.mock.calls[0][1] as Record<
      string,
      unknown
    >;
    expect(payload.event_type).toBe('analyzer');
    expect(payload.user_id).toBe('user-1');
    expect(payload.document_id).toBe('doc-1');
    expect(payload.session_id).toBeTruthy();
    expect(payload.thread_id).toBeTruthy();
    expect(payload.auto_plan_mode).toBe(true);
    expect(payload.auto_action_mode).toBe(true);
    expect(payload.manual_plan_mode).toBe(false);
    expect(payload.db).toBe('redis');
    expect(payload.data).toEqual(body.data);
  });

  it('analyzer_tool: dùng event_type riêng, cùng shape payload', async () => {
    await service.analyzeTool('user-1', 'ds-1', body as any);

    const payload = producerMock.publish.mock.calls[0][1] as Record<
      string,
      unknown
    >;
    expect(payload.event_type).toBe('analyzer_tool');
    expect(correlationMock.registerPending).toHaveBeenCalledWith(
      'key-1',
      300_000,
      'analyzer_tool',
      'job-1',
    );
  });

  it('interrupt (has_finished=false) ⇒ job suspended với resumeStep analyzer_feedback', async () => {
    pendingResponse = { has_finished: false, ai_message: 'Chọn biến phụ thuộc?' };

    const res = await service.analyze('user-1', 'ds-1', body as any);

    expect(res.status).toBe('suspended');
    expect(res.ai_message).toBe('Chọn biến phụ thuộc?');
    expect(prismaMock.job.update).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'suspended',
          resumeStep: 'analyzer_feedback',
        }),
      }),
    );
  });

  it('result_html rỗng ⇒ report_html_missing=true nhưng job finished', async () => {
    pendingResponse = { has_finished: true, result_html: '', upload_failed: true };

    const res = await service.analyze('user-1', 'ds-1', body as any);

    expect(res.status).toBe('finished');
    expect(res.report_html_missing).toBe(true);
    expect(res.upload_failed).toBe(true);
    expect(prismaMock.job.update).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'finished' }),
      }),
    );
  });

  it('dataset không thuộc user ⇒ 404, không publish', async () => {
    prismaMock.dataset.findFirst = jest.fn(() => Promise.resolve(null));

    await expect(
      service.analyze('user-2', 'ds-1', body as any),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(producerMock.publish).not.toHaveBeenCalled();
  });
});
