import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
} from '@aws-sdk/client-s3';
import 'multer';

export interface UploadPdfResult {
  bucket: string;
  key: string;
  url: string;
  fileName: string;
  size: number;
  mimeType: string;
}

@Injectable()
export class MinioStorageService implements OnModuleInit {
  private readonly logger = new Logger(MinioStorageService.name);
  private s3Client!: S3Client;
  private bucket!: string;
  private endpoint!: string;

  constructor(private readonly configService: ConfigService) {
    this.initClient();
  }

  private initClient() {
    this.endpoint =
      this.configService.get<string>('minio.endpoint') ||
      process.env.MINIO_ENDPOINT ||
      'http://167.254.70.125:9000';
    const accessKey =
      this.configService.get<string>('minio.accessKey') ||
      process.env.MINIO_ACCESS_KEY ||
      'minio_admin';
    const secretKey =
      this.configService.get<string>('minio.secretKey') ||
      process.env.MINIO_SECRET_KEY ||
      'minio_password_local';
    const region =
      this.configService.get<string>('minio.region') ||
      process.env.MINIO_REGION ||
      'us-east-1';
    this.bucket =
      this.configService.get<string>('minio.bucket') ||
      process.env.MINIO_BUCKET ||
      'autoresearch-documents';

    this.s3Client = new S3Client({
      endpoint: this.endpoint,
      region,
      credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
      },
      forcePathStyle: true, // Required for MinIO
    });
  }

  async onModuleInit() {
    try {
      await this.ensureBucketExists();
    } catch (err: any) {
      this.logger.warn(`MinIO bucket check skipped/failed: ${err.message}`);
    }
  }

  async ensureBucketExists(bucketName: string = this.bucket): Promise<void> {
    try {
      await this.s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));
    } catch (error: any) {
      if (
        error.name === 'NotFound' ||
        error.$metadata?.httpStatusCode === 404 ||
        error.Code === 'NoSuchBucket'
      ) {
        this.logger.log(`Bucket [${bucketName}] not found. Creating it...`);
        await this.s3Client.send(
          new CreateBucketCommand({ Bucket: bucketName }),
        );
        this.logger.log(`Bucket [${bucketName}] created successfully.`);
      } else {
        throw error;
      }
    }
  }

  async uploadPdf(
    file: Express.Multer.File,
    userId?: string,
    folder?: string,
  ): Promise<UploadPdfResult> {
    if (!file || !file.buffer) {
      throw new BadRequestException('No file uploaded or file buffer is empty');
    }

    const isPdf =
      file.mimetype === 'application/pdf' ||
      file.originalname?.toLowerCase().endsWith('.pdf');

    if (!isPdf) {
      throw new BadRequestException('Invalid file type. Only PDF files are accepted');
    }

    const sanitizedFileName = (file.originalname || 'document.pdf').replace(
      /[^a-zA-Z0-9.-]/g,
      '_',
    );
    const subFolder = folder || (userId ? `users/${userId}` : 'documents');
    const key = `${subFolder}/${Date.now()}-${sanitizedFileName}`;

    try {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: file.buffer,
          ContentType: 'application/pdf',
        }),
      );

      const url = `${this.endpoint}/${this.bucket}/${key}`;

      this.logger.log(
        `Uploaded PDF successfully to MinIO: [${this.bucket}] ${key}`,
      );

      return {
        bucket: this.bucket,
        key,
        url,
        fileName: file.originalname,
        size: file.size,
        mimeType: 'application/pdf',
      };
    } catch (error: any) {
      this.logger.error(`Failed to upload PDF to MinIO: ${error.message}`, error.stack);
      throw new InternalServerErrorException(
        `Failed to upload file to storage: ${error.message}`,
      );
    }
  }

  getBucketName(): string {
    return this.bucket;
  }

  getClient(): S3Client {
    return this.s3Client;
  }
}
