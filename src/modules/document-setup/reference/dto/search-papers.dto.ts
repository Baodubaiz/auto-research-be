import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SearchPapersDto {
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
  @IsArray()
  @IsString({ each: true })
  subdomains?: string[];

  @IsString()
  @IsNotEmpty()
  query!: string;

  @IsOptional()
  @IsString()
  countryFilter?: string = 'both';

  @IsOptional()
  @IsBoolean()
  oaFilter?: boolean;

  @IsOptional()
  @IsBoolean()
  isOa?: boolean;

  @IsOptional()
  @IsBoolean()
  isTool?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  downloadedPapers?: string[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1900)
  cutOffYearLow?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Max(2100)
  cutOffYearHigh?: number;

  @IsOptional()
  @IsString()
  searchRange?: string = 'all';

  @IsOptional()
  @IsBoolean()
  useWebSearch?: boolean;


  @IsOptional()
  @IsString()
  language?: string = 'vi';

  @IsOptional()
  @IsString()
  sessionId?: string;

  @IsOptional()
  proposal?: {
    title?: string;
    problem_statement?: string;
    problemStatement?: string;
    motivation?: string;
    research_gap?: string;
    researchGap?: string;
  };

  @IsOptional()
  @IsString()
  proposalId?: string;
}
