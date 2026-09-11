import { Injectable, NotFoundException } from '@nestjs/common';
import { JobStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CreateJobDto } from './dto/create-job/create-job.dto';
import { ResumeJobDto } from './dto/resume-job/resume-job.dto';
import { UpdateJobDto } from './dto/update-job/update-job.dto';
import { UpdateJobStatusDto } from './dto/update-job-status/update-job-status.dto';

@Injectable()
export class JobService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateJobDto) {
    return this.prisma.job.create({ data: dto });
  }

  findAll(status?: JobStatus) {
    return this.prisma.job.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const job = await this.prisma.job.findUnique({ where: { id } });
    if (!job) throw new NotFoundException('Job not found');
    return job;
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
    return this.prisma.job.update({
      where: { id },
      data: {
        status: JobStatus.pending,
        resumeStep: dto.resumeStep,
        payload: dto.payload as Prisma.InputJsonValue | undefined,
        errorCode: null,
        errorMessage: null,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.job.delete({ where: { id } });
    return { message: 'Job deleted successfully' };
  }
}
