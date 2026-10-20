import { jest } from '@jest/globals';
import { INestApplication, Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { REDIS_CLIENT } from '../../../common/messaging.tokens';
import { AdminGuard } from '../../../common/guards/admin.guard';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { AdminDocumentController } from './admin-document.controller';
import { AdminDocumentsAiService } from './admin-documents-ai.service';

describe('AdminDocumentController HTTP', () => {
  let app: INestApplication;
  let baseUrl: string;
  const jwt = new JwtService({ secret: 'admin-controller-test-secret' });
  const adminToken = jwt.sign({ sub: 'admin-1', role: 'admin' });
  const userToken = jwt.sign({ sub: 'user-1', role: 'user' });
  const studentToken = jwt.sign({ sub: 'student-1', role: 'student' });
  const service = {
    uploadSampleDocument:
      jest.fn<AdminDocumentsAiService['uploadSampleDocument']>(),
    uploadUserGuide: jest.fn<AdminDocumentsAiService['uploadUserGuide']>(),
    getJournals: jest.fn<AdminDocumentsAiService['getJournals']>(),
  };
  const routes = [
    { method: 'POST', path: '/sample' },
    { method: 'POST', path: '/user-guide' },
    { method: 'GET', path: '/journals' },
  ];

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [AdminDocumentController],
      providers: [
        AdminGuard,
        JwtAuthGuard,
        { provide: AdminDocumentsAiService, useValue: service },
        { provide: JwtService, useValue: jwt },
        { provide: ConfigService, useValue: new ConfigService() },
        { provide: REDIS_CLIENT, useValue: {} },
      ],
    }).compile();
    app = module.createNestApplication({ logger: false });
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.listen(0, '127.0.0.1');
    baseUrl = `${await app.getUrl()}/api/v1/admin/documents`;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    service.uploadSampleDocument.mockResolvedValue({ accepted: true });
    service.uploadUserGuide.mockResolvedValue({ accepted: true });
    service.getJournals.mockResolvedValue({ journals: [] });
  });

  afterAll(async () => {
    await app?.close();
  });

  it.each(routes)(
    'returns 401 without a token: $path',
    async ({ method, path }) => {
      const response = await fetch(`${baseUrl}${path}`, { method });
      expect(response.status).toBe(401);
      expect(service.uploadSampleDocument).not.toHaveBeenCalled();
      expect(service.uploadUserGuide).not.toHaveBeenCalled();
      expect(service.getJournals).not.toHaveBeenCalled();
    },
  );

  it.each(routes)(
    'returns 403 for a normal user: $path',
    async ({ method, path }) => {
      const response = await fetch(`${baseUrl}${path}`, {
        method,
        headers: { Authorization: `Bearer ${userToken}` },
      });
      expect(response.status).toBe(403);
      expect(service.uploadSampleDocument).not.toHaveBeenCalled();
      expect(service.uploadUserGuide).not.toHaveBeenCalled();
      expect(service.getJournals).not.toHaveBeenCalled();
    },
  );

  it('passes the authenticated admin and sample body to the service', async () => {
    const body = { title: 'Sample', fileUrl: 'https://example.com/sample.pdf' };
    const response = await fetch(`${baseUrl}/sample`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ accepted: true });
    expect(service.uploadSampleDocument).toHaveBeenCalledWith('admin-1', body);
  });

  it('passes the authenticated admin and guide body to the service', async () => {
    const body = {
      documents_urls: ['https://example.com/guide.pdf'],
      data_id: 'guide-1',
    };
    const response = await fetch(`${baseUrl}/user-guide`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    expect(response.status).toBe(201);
    expect(service.uploadUserGuide).toHaveBeenCalledWith('admin-1', body);
  });

  it.each(routes)(
    'returns 403 for a student: $path',
    async ({ method, path }) => {
      const response = await fetch(`${baseUrl}${path}`, {
        method,
        headers: { Authorization: `Bearer ${studentToken}` },
      });
      expect(response.status).toBe(403);
      expect(service.uploadSampleDocument).not.toHaveBeenCalled();
      expect(service.uploadUserGuide).not.toHaveBeenCalled();
      expect(service.getJournals).not.toHaveBeenCalled();
    },
  );

  it.each([
    { data_id: 'guide-1' },
    { documents_urls: null, data_id: 'guide-1' },
    { documents_urls: [], data_id: 'guide-1' },
    { documents_urls: 'https://example.com/guide.pdf', data_id: 'guide-1' },
    { documents_urls: [123], data_id: 'guide-1' },
    { documents_urls: ['not-a-url'], data_id: 'guide-1' },
    { documents_urls: ['ftp://example.com/guide.pdf'], data_id: 'guide-1' },
    { documents_urls: ['https://example.com/guide.pdf'] },
    { documents_urls: ['https://example.com/guide.pdf'], data_id: 123 },
    { documents_urls: ['https://example.com/guide.pdf'], data_id: '   ' },
  ])(
    'rejects an invalid guide before sending it to the service: %j',
    async (body) => {
      const response = await fetch(`${baseUrl}/user-guide`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      expect(response.status).toBe(400);
      expect(service.uploadUserGuide).not.toHaveBeenCalled();
    },
  );

  it('logs validation failure using verified identity and ignores client identity fields', async () => {
    const log = jest
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => {});
    try {
      const response = await fetch(`${baseUrl}/user-guide`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data_id: 'guide-1', user_id: 'spoofed-user' }),
      });
      expect(response.status).toBe(400);
      expect(log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'admin_documents_request',
          userId: 'admin-1',
          role: 'admin',
          statusCode: 400,
          outcome: 'failed',
        }),
      );
      expect(service.uploadUserGuide).not.toHaveBeenCalled();
    } finally {
      log.mockRestore();
    }
  });

  it('passes journal query parameters to the service', async () => {
    const response = await fetch(
      `${baseUrl}/journals?field=AI&ranking=Q1&query=test`,
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      },
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ journals: [] });
    expect(service.getJournals).toHaveBeenCalledWith('admin-1', {
      field: 'AI',
      ranking: 'Q1',
      query: 'test',
    });
  });

  it('rejects an invalid sample body before calling the service', async () => {
    const response = await fetch(`${baseUrl}/sample`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title: 'Sample' }),
    });
    expect(response.status).toBe(400);
    expect(service.uploadSampleDocument).not.toHaveBeenCalled();
  });
});
