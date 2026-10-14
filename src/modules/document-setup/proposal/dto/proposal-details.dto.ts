import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

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
  modelId?: string = 'localhost';

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

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  titles!: string[];

  @IsOptional()
  @IsString()
  field?: string;

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

export class GetResearchTypeDto {
  @IsString()
  @IsNotEmpty()
  documentId!: string;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsOptional()
  @IsString()
  problemStatement?: string;

  @IsOptional()
  @IsString()
  motivation?: string;

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

export interface ProposalDetailsDispatchOptions {
  userId: string;
  documentId: string;
  sessionId?: string;
  eventType: string;
  errorCode: number;
  dto: { modelId?: string; language?: string; [key: string]: any };
  kafkaData: Record<string, unknown>;
  onSuccess?: (data: Record<string, unknown>) => Promise<void>;
}
