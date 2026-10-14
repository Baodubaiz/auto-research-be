import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JobStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CreateJobDto } from './dto/create-job/create-job.dto';
import { ResumeJobDto } from './dto/resume-job/resume-job.dto';
import { UpdateJobDto } from './dto/update-job/update-job.dto';
import { UpdateJobStatusDto } from './dto/update-job-status/update-job-status.dto';
import { JobsKafkaProducer } from './kafka/jobs-kafka.producer';
import { JobFallbackService } from './helpers/job-fallback.service';
import {
  toProcessStatus,
  PROCESS_STATUS_NAMES,
} from '../../common/enums/process-status.enum';

@Injectable()
export class JobService {
  private readonly logger = new Logger(JobService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly kafkaProducer: JobsKafkaProducer,
    private readonly fallbackService: JobFallbackService,
    private readonly configService: ConfigService,
  ) {}

  async create(dto: CreateJobDto) {
    const documentId = dto.documentId || dto.document_id;
    const sessionId = dto.sessionId || dto.session_id;

    let job = await this.prisma.job.create({
      data: {
        module: dto.module,
        action: dto.action,
        documentId: documentId || null,
        sessionId: sessionId || null,
        status: dto.status || JobStatus.pending,
        resumeStep: dto.resumeStep,
        payload: dto.payload as Prisma.InputJsonValue | undefined,
        result: dto.result as Prisma.InputJsonValue | undefined,
        errorCode: dto.errorCode,
        errorMessage: dto.errorMessage,
      },
    });

    const kafkaEnabled =
      this.configService.get<string>('KAFKA_ENABLED', 'false') === 'true';

    if (kafkaEnabled) {
      await this.kafkaProducer.publishJob(job);
    } else {
      job = await this.fallbackService.processJobFallback(job);
    }

    const processStatus = toProcessStatus(job.status);
    return {
      job_id: job.id,
      id: job.id,
      status: job.status,
      processStatus,
      statusName: PROCESS_STATUS_NAMES[processStatus],
      module: job.module,
      action: job.action,
      document_id: job.documentId,
      session_id: job.sessionId,
      data: job.result,
      errorCode: job.errorCode,
      errorMessage: job.errorMessage,
      createdAt: job.createdAt,
    };
  }

  async findAll(status?: JobStatus) {
    const jobs = await this.prisma.job.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
    });

    return jobs.map((j) => {
      const processStatus = toProcessStatus(j.status);
      return {
        job_id: j.id,
        id: j.id,
        status: j.status,
        processStatus,
        statusName: PROCESS_STATUS_NAMES[processStatus],
        module: j.module,
        action: j.action,
        data: j.result,
        error: j.errorMessage
          ? { code: j.errorCode, message: j.errorMessage }
          : null,
        errorCode: j.errorCode,
        errorMessage: j.errorMessage,
        createdAt: j.createdAt,
        updatedAt: j.updatedAt,
      };
    });
  }

  async findOne(id: string) {
    const job = await this.prisma.job.findUnique({ where: { id } });
    if (!job) throw new NotFoundException('Job not found');

    const processStatus = toProcessStatus(job.status);
    return {
      job_id: job.id,
      id: job.id,
      status: job.status,
      processStatus,
      statusName: PROCESS_STATUS_NAMES[processStatus],
      module: job.module,
      action: job.action,
      document_id: job.documentId,
      session_id: job.sessionId,
      data: job.result,
      error: job.errorMessage
        ? { code: job.errorCode, message: job.errorMessage }
        : null,
      errorCode: job.errorCode,
      errorMessage: job.errorMessage,
      payload: job.payload,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    };
  }

  async update(id: string, dto: UpdateJobDto) {
    await this.findOne(id);
    return this.prisma.job.update({ where: { id }, data: dto });
  }

  async updateStatus(id: string, dto: UpdateJobStatusDto) {
    await this.findOne(id);
    return this.prisma.job.update({
      where: { id },
      data: {
        status: dto.status,
        errorCode: dto.errorCode,
        errorMessage: dto.errorMessage,
      },
    });
  }

  async resume(id: string, dto: ResumeJobDto) {
    await this.findOne(id);
    const updatedJob = await this.prisma.job.update({
      where: { id },
      data: {
        status: JobStatus.pending,
        resumeStep: dto.resumeStep,
        payload: dto.payload as Prisma.InputJsonValue | undefined,
        errorCode: null,
        errorMessage: null,
      },
    });

    const kafkaEnabled =
      this.configService.get<string>('KAFKA_ENABLED', 'false') === 'true';
    if (kafkaEnabled) {
      await this.kafkaProducer.publishJob(updatedJob);
    } else {
      await this.fallbackService.processJobFallback(updatedJob);
    }

    const processStatus = toProcessStatus(updatedJob.status);
    return {
      job_id: updatedJob.id,
      id: updatedJob.id,
      status: updatedJob.status,
      processStatus,
      statusName: PROCESS_STATUS_NAMES[processStatus],
      message: 'Job resumed',
    };
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.job.delete({ where: { id } });
    return { message: 'Job deleted successfully' };
  }
}
