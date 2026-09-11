import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { FileProcessingStatus } from '@prisma/client';

export class UpdateUserUploadedDocumentDto {
  @IsOptional()
  @IsString()
  fileName?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsEnum(FileProcessingStatus)
  processingStatus?: FileProcessingStatus;

  @IsOptional()
  @IsBoolean()
  isEmbedded?: boolean;
}