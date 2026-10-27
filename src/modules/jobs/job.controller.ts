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
  UseGuards,
} from '@nestjs/common';
import { JobStatus } from '@prisma/client';
import { Observable, interval, map, switchMap, takeWhile } from 'rxjs';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CreateJobDto } from './dto/create-job/create-job.dto';
import { ResumeJobDto } from './dto/resume-job/resume-job.dto';
import { UpdateJobDto } from './dto/update-job/update-job.dto';
import { UpdateJobStatusDto } from './dto/update-job-status/update-job-status.dto';
import { JobService } from './job.service';

@Controller('jobs')
@UseGuards(JwtAuthGuard)
export class JobController {
  constructor(private readonly jobService: JobService) {}

  @Post()
  create(
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateJobDto,
  ) {
    return this.jobService.create(dto, userId);
  }

  @Get()
  findAll(
    @CurrentUser('sub') userId: string,
    @Query('status') status?: JobStatus,
  ) {
    return this.jobService.findAll(status, userId);
  }

  @Get(':id')
  findOne(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
  ) {
    return this.jobService.findOne(id, userId);
  }

  @Sse(':id/stream')
  stream(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
  ): Observable<{ data: any }> {
    return interval(1500).pipe(
      switchMap(() => this.jobService.findOne(id, userId)),
      takeWhile(
        (job) => job.status === 'pending' || job.status === 'processing',
        true,
      ),
      map((job) => ({ data: job })),
    );
  }

  @Post(':id/resume')
  resumePost(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Body() dto: ResumeJobDto,
  ) {
    return this.jobService.resume(id, dto, userId);
  }

  @Patch(':id/resume')
  resumePatch(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Body() dto: ResumeJobDto,
  ) {
    return this.jobService.resume(id, dto, userId);
  }

  @Patch(':id')
  update(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateJobDto,
  ) {
    return this.jobService.update(id, dto, userId);
  }

  @Patch(':id/status')
  updateStatus(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateJobStatusDto,
  ) {
    return this.jobService.updateStatus(id, dto, userId);
  }

  @Delete(':id')
  remove(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
  ) {
    return this.jobService.remove(id, userId);
  }
}
