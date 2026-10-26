import {
  ArrayNotEmpty,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsInt,
  Min,
  Max,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';

const minioPathPattern = /^(?![a-z][a-z0-9+.-]*:\/\/)[^/\s]+\/.+$/i;

// Tài liệu mẫu gửi cho AI
export class AdminSampleDocumentDto {
  @IsNotEmpty()
  @IsString()
  title!: string;

  @IsNotEmpty()
  @IsString()
  @Matches(minioPathPattern, { message: 'source must be a bucket/key path' })
  source!: string;

  @IsNotEmpty()
  @IsString()
  @Matches(/\S/, { message: 'refId must not be blank' })
  refId!: string;

  @IsOptional()
  @IsString()
  language?: string;
}

// Hướng dẫn sử dụng gửi cho AI
export class AdminUserGuideDto {
  @IsArray()
  @ArrayNotEmpty()
  @Matches(minioPathPattern, {
    each: true,
    message: 'documents_urls must contain bucket/key paths',
  })
  documents_urls!: string[];

  @IsString()
  @IsNotEmpty()
  @Matches(/\S/, { message: 'data_id must not be blank' })
  data_id!: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  guideType?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  version?: string;
}

// Bộ lọc tra cứu tạp chí
export class GetJournalsQueryDto {
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : value,
  )
  @IsInt()
  @Min(1999)
  @Max(new Date().getFullYear())
  last_updated?: number;

  @IsOptional()
  @IsString()
  field?: string;

  @IsOptional()
  @IsString()
  ranking?: string;

  @IsOptional()
  @IsString()
  query?: string;
}
