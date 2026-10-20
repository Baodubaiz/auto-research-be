import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { DEFAULT_AI_MODEL } from '../../../../common/kafka/kafka.constants';

export class GenerateTitleDescriptionDto {
  @IsString()
  @IsNotEmpty()
  documentId!: string;

  @IsOptional()
  @IsString()
  proposalId?: string;

  @IsString()
  @IsNotEmpty()
  title!: string;

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
  level?: string = 'bachelor';

  @IsOptional()
  @IsArray()
  knowledgeBase?: Array<Record<string, unknown>>;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keywords?: string[];

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

export class GenerateTitleDescriptionNoInfoDto {
  @IsString()
  @IsNotEmpty()
  documentId!: string;

  @IsOptional()
  @IsString()
  proposalId?: string;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

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

export class MixTitlesDto {
  @IsString()
  @IsNotEmpty()
  documentId!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  titles?: string[];

  @IsOptional()
  @IsArray()
  proposals?: Array<Record<string, unknown>>;

  @IsOptional()
  @IsString()
  field?: string;

  @IsOptional()
  @IsString()
  domain?: string;

  @IsOptional()
  @IsString()
  level?: string = 'bachelor';

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

export class GetResearchTypeDto {
  @IsString()
  @IsNotEmpty()
  documentId!: string;

  @IsOptional()
  @IsString()
  proposalId?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  field?: string;

  @IsOptional()
  @IsString()
  domain?: string;

  @IsOptional()
  @IsString()
  problemStatement?: string;

  @IsOptional()
  @IsString()
  motivation?: string;

  @IsOptional()
  @IsString()
  researchGap?: string;

  @IsOptional()
  proposal?: Record<string, unknown>;

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
