import { jest } from '@jest/globals';
import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MinioStorageService } from './minio-storage.service';

describe('MinioStorageService', () => {
  let service: MinioStorageService;
  let mockConfigService: Record<string, any>;
  let mockS3Send: ReturnType<typeof jest.fn>;

  beforeEach(() => {
    mockConfigService = {
      get: (jest.fn() as any).mockImplementation((key: string) => {
        const config: Record<string, any> = {
          'minio.endpoint': 'http://localhost:9000',
          'minio.accessKey': 'test-access',
          'minio.secretKey': 'test-secret',
          'minio.bucket': 'test-bucket',
          'minio.region': 'us-east-1',
          'minio.useSsl': false,
        };
        return config[key];
      }),
    };

    service = new MinioStorageService(
      mockConfigService as unknown as ConfigService,
    );

    mockS3Send = jest.fn();
    (service as any).s3Client = {
      send: mockS3Send,
    };
  });

  const createMockFile = (
    overrides?: Partial<Express.Multer.File>,
  ): Express.Multer.File => ({
    fieldname: 'file',
    originalname: 'research-paper.pdf',
    encoding: '7bit',
    mimetype: 'application/pdf',
    size: 1024,
    buffer: Buffer.from('%PDF-1.4 test content'),
    stream: null as any,
    destination: '',
    filename: '',
    path: '',
    ...overrides,
  });

  it('should upload PDF successfully and return bucket and key', async () => {
    mockS3Send.mockResolvedValue({} as never);

    const mockFile = createMockFile();
    const result = await service.uploadPdf(mockFile, 'user-123');

    expect(result.bucket).toBe('test-bucket');
    expect(result.key).toContain('users/user-123/');
    expect(result.key).toContain('research-paper.pdf');
    expect(result.url).toBe(`http://localhost:9000/test-bucket/${result.key}`);
    expect(result.size).toBe(1024);
    expect(result.mimeType).toBe('application/pdf');
    expect(mockS3Send).toHaveBeenCalledTimes(1);
  });

  it('should reject file if buffer is missing', async () => {
    const mockFile = createMockFile({ buffer: undefined as any });

    await expect(service.uploadPdf(mockFile)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should reject non-PDF file', async () => {
    const mockFile = createMockFile({
      originalname: 'virus.exe',
      mimetype: 'application/octet-stream',
    });

    await expect(service.uploadPdf(mockFile)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should throw InternalServerErrorException when S3 send fails', async () => {
    mockS3Send.mockRejectedValue(new Error('S3 Connection Timed Out') as never);

    const mockFile = createMockFile();

    await expect(service.uploadPdf(mockFile)).rejects.toThrow(
      InternalServerErrorException,
    );
  });
});
