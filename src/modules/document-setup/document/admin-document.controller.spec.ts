import { jest } from '@jest/globals';
import { INestApplication, ValidationPipe } from '@nestjs/common';
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
    const body = { title: 'Guide', guideType: 'faq', content: 'Instructions' };
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
