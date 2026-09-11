import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { SlideStatus } from '@prisma/client';

export class UpdateGeneratedSlideDto {
  @IsOptional()
  @IsString()
  slideStyle?: string;

  @IsOptional()
  @IsBoolean()
  manualMode?: boolean;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsString()
  pptxUrl?: string;

  @IsOptional()
  @IsEnum(SlideStatus)
  status?: SlideStatus;

  @IsOptional()
  @IsString()
  progressStep?: string;
}