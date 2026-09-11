import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { ReferenceDownloadStatus } from '@prisma/client';

export class UpdateReferenceDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  authors?: string;

  @IsOptional()
  @IsString()
  journal?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  year?: number;

  @IsOptional()
  @IsBoolean()
  openAccess?: boolean;

  @IsOptional()
  @IsEnum(ReferenceDownloadStatus)
  downloadedStatus?: ReferenceDownloadStatus;

  @IsOptional()
  @IsString()
  url?: string;

  @IsOptional()
  @IsString()
  abstract?: string;
}