import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Sse,
} from '@nestjs/common';
import { JobStatus } from '@prisma/client';
import { Observable, interval, map, switchMap, takeWhile } from 'rxjs';
import { CreateJobDto } from './dto/create-job/create-job.dto';
import { ResumeJobDto } from './dto/resume-job/resume-job.dto';
import { UpdateJobDto } from './dto/update-job/update-job.dto';
import { UpdateJobStatusDto } from './dto/update-job-status/update-job-status.dto';
import { JobService } from './job.service';

@Controller('jobs')
export class JobController {
  constructor(private readonly jobService: JobService) {}

  @Post()
  create(@Body() dto: CreateJobDto) {
    return this.jobService.create(dto);
  }

  @Get()
  findAll(@Query('status') status?: JobStatus) {
    return this.jobService.findAll(status);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.jobService.findOne(id);
  }

  @Sse(':id/stream')
  stream(@Param('id') id: string): Observable<{ data: any }> {
    return interval(1500).pipe(
      switchMap(() => this.jobService.findOne(id)),
      takeWhile(
        (job) => job.status === 'pending' || job.status === 'processing',
        true,
      ),
      map((job) => ({ data: job })),
    );
  }

  @Post(':id/resume')
  resumePost(@Param('id') id: string, @Body() dto: ResumeJobDto) {
    return this.jobService.resume(id, dto);
  }

  @Patch(':id/resume')
  resumePatch(@Param('id') id: string, @Body() dto: ResumeJobDto) {
    return this.jobService.resume(id, dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateJobDto) {
    return this.jobService.update(id, dto);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateJobStatusDto) {
    return this.jobService.updateStatus(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.jobService.remove(id);
  }
}
