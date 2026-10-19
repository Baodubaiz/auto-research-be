import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class UserPreferenceDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  numSlides?: number;

  @IsOptional()
  @IsString()
  theme?: string;
}

export class GenerateSlideRequestDto {
  @IsUUID()
  @IsNotEmpty()
  documentId!: string;

  @IsOptional()
  @IsString()
  sessionId?: string;

  @IsOptional()
  @IsString()
  rawReport?: string;

  @IsOptional()
  @IsObject()
  userPreference?: UserPreferenceDto;

  @IsOptional()
  @IsBoolean()
  manualMode?: boolean;

  @IsOptional()
  @IsString()
  slideStyle?: string;

  @IsOptional()
  @IsString()
  modelId?: string;

  @IsOptional()
  @IsString()
  language?: string;
}
