import { JobStatus, ModuleType, Prisma } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class CreateJobDto {
  @IsEnum(ModuleType)
  module!: ModuleType;

  @IsString()
  action!: string;

  @IsOptional()
  @IsString()
  documentId?: string;

  @IsOptional()
  @IsString()
  sessionId?: string;

  @IsOptional()
  @IsEnum(JobStatus)
  status?: JobStatus;

  @IsOptional()
  @IsString()
  resumeStep?: string;

  @IsOptional()
  payload?: Prisma.InputJsonValue;

  @IsOptional()
  result?: Prisma.InputJsonValue;

  @IsOptional()
  @IsString()
  errorCode?: string;

  @IsOptional()
  @IsString()
  errorMessage?: string;
}