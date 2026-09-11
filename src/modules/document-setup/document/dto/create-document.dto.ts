import { IsBoolean, IsDefined, IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { DocStatus, Prisma } from '@prisma/client';

export class CreateDocumentDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  field?: string;

  @IsOptional()
  @IsString()
  documentType?: string;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsDefined()
  domains?: Prisma.InputJsonValue;

  @IsOptional()
  @IsDefined()
  subdomains?: Prisma.InputJsonValue;

  @IsOptional()
  @IsInt()
  @Min(0)
  numberOfDomains?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  numberOfSubdomains?: number;

  @IsOptional()
  @IsBoolean()
  webSearchEnabled?: boolean;

  @IsOptional()
  @IsString()
  researchType?: string;

  @IsOptional()
  @IsEnum(DocStatus)
  status?: DocStatus;
}
