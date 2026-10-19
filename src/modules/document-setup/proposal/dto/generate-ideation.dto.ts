import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DEFAULT_AI_MODEL } from '../../../../common/kafka/kafka.constants';

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
  @Type(() => Number)
  @IsInt()
  @Min(1)
  domainsNum?: number;

  @IsOptional()
  @IsBoolean()
  isTool?: boolean = false;

  @IsOptional()
  @IsString()
  modelId?: string = DEFAULT_AI_MODEL;

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
  @Type(() => Number)
  @IsInt()
  @Min(1)
  subdomainsNum?: number;

  @IsOptional()
  @IsBoolean()
  isTool?: boolean = false;

  @IsOptional()
  @IsString()
  modelId?: string = DEFAULT_AI_MODEL;

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

  @IsOptional()
  @IsString()
  proposalId?: string;

  @IsOptional()
  proposal?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  field?: string;

  @IsOptional()
  @IsString()
  domain?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  subdomains?: string[];

  @IsOptional()
  @IsString()
  modelId?: string = DEFAULT_AI_MODEL;

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
  level?: string = 'bachelor';

  @IsOptional()
  @IsBoolean()
  useWebSearch?: boolean = false;

  @IsOptional()
  @IsString()
  modelId?: string = DEFAULT_AI_MODEL;

  @IsOptional()
  @IsString()
  language?: string = 'vi';

  @IsOptional()
  @IsString()
  sessionId?: string;
}
