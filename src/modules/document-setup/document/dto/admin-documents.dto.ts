import {
  ArrayNotEmpty,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
} from 'class-validator';

// Tài liệu mẫu gửi cho AI
export class AdminSampleDocumentDto {
  @IsNotEmpty()
  @IsString()
  title!: string;

  @IsNotEmpty()
  @IsString()
  fileUrl!: string;

  @IsOptional()
  @IsString()
  field?: string;

  @IsOptional()
  @IsString()
  documentType?: string;

  @IsOptional()
  @IsString()
  language?: string;
}

// Hướng dẫn sử dụng gửi cho AI
export class AdminUserGuideDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsUrl(
    { protocols: ['http', 'https'], require_protocol: true },
    { each: true },
  )
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
  @IsString()
  field?: string;

  @IsOptional()
  @IsString()
  ranking?: string;

  @IsOptional()
  @IsString()
  query?: string;
}
