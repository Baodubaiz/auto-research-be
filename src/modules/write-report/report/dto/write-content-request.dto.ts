import {
  IsArray,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class WriteContentRequestDto {
  @IsUUID()
  @IsNotEmpty()
  documentId!: string;

  @IsString()
  @IsNotEmpty()
  field!: string;

  @IsOptional()
  @IsString()
  domain?: string;

  @IsOptional()
  @IsString()
  referencesStyle?: string;

  @IsObject()
  @IsNotEmpty()
  finalProposal!: Record<string, unknown>;

  @IsArray()
  @IsOptional()
  papersSearch?: Array<Record<string, unknown>>;

  @IsObject()
  @IsNotEmpty()
  outline!: Record<string, unknown>;

  @IsString()
  @IsNotEmpty()
  outlineCode!: string;

  @IsOptional()
  @IsString()
  modelId?: string;

  @IsOptional()
  @IsString()
  language?: string;
}
