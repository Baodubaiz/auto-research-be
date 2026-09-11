import { IsBoolean, IsDefined, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Prisma } from '@prisma/client';

export class CreateDocumentKeywordDto {
  @IsString()
  documentId!: string;

  @IsOptional()
  @IsDefined()
  keywordsMain?: Prisma.InputJsonValue;

  @IsOptional()
  @IsDefined()
  keywordsSub?: Prisma.InputJsonValue;

  @IsOptional()
  @IsString()
  searchQuery?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  yearFrom?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  yearTo?: number;

  @IsOptional()
  @IsBoolean()
  onlyOpenAccess?: boolean;
}