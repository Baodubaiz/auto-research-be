import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class GenerateDomainsDto {
  @IsString()
  @IsNotEmpty()
  documentId!: string;

  @IsOptional()
  @IsString()
  field?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  numberOfDomains?: number;

  @IsOptional()
  @IsString()
  modelId?: string = 'localhost';

  @IsOptional()
  @IsString()
  language?: string = 'vi';

  @IsOptional()
  @IsString()
  sessionId?: string;
}

export class GenerateSubdomainsDto {
  @IsString()
  @IsNotEmpty()
  documentId!: string;

  @IsString()
  @IsNotEmpty()
  field!: string;

  @IsOptional()
  @IsString()
  domain?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  numberOfSubdomains?: number;

  @IsOptional()
  @IsString()
  modelId?: string = 'localhost';

  @IsOptional()
  @IsString()
  language?: string = 'vi';

  @IsOptional()
  @IsString()
  sessionId?: string;
}

export class GenerateKeywordsDto {
  @IsString()
  @IsNotEmpty()
  documentId!: string;

  @IsString()
  @IsNotEmpty()
  field!: string;

  @IsString()
  @IsNotEmpty()
  domain!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  subdomains?: string[];

  @IsOptional()
  @IsString()
  modelId?: string = 'localhost';

  @IsOptional()
  @IsString()
  language?: string = 'vi';

  @IsOptional()
  @IsString()
  sessionId?: string;
}

export class GenerateTitlesDto {
  @IsString()
  @IsNotEmpty()
  documentId!: string;

  @IsString()
  @IsNotEmpty()
  field!: string;

  @IsString()
  @IsNotEmpty()
  domain!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  subdomains?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keywords?: string[];

  @IsOptional()
  @IsString()
  modelId?: string = 'localhost';

  @IsOptional()
  @IsString()
  language?: string = 'vi';

  @IsOptional()
  @IsString()
  sessionId?: string;
}

export interface IdeationOptions {
  userId: string;
  documentId: string;
  sessionId?: string;
  eventType: string;
  errorCode: number;
  dto: { modelId?: string; language?: string; [key: string]: any };
  kafkaData: Record<string, unknown>;
  onSuccess?: (data: Record<string, unknown>) => Promise<void>;
}
