import { IsEnum, IsOptional, IsString } from 'class-validator';
import { AnalysisMode, Prisma } from '@prisma/client';

export class UpdateDatasetDto {
  @IsOptional()
  @IsString()
  fileName?: string;

  @IsOptional()
  @IsString()
  filePath?: string;

  @IsOptional()
  rawData?: Prisma.InputJsonValue;

  @IsOptional()
  @IsEnum(AnalysisMode)
  analysisMode?: AnalysisMode;

  @IsOptional()
  @IsString()
  feedback?: string;

  @IsOptional()
  analysisResults?: Prisma.InputJsonValue;
}