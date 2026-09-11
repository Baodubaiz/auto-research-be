import { IsOptional, IsString } from 'class-validator';

export class ResumeJobDto {
  @IsString()
  resumeStep!: string;

  @IsOptional()
  payload?: unknown;
}