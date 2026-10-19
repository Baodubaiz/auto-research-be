import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

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
  @IsNotEmpty()
  @IsString()
  title!: string;

  @IsNotEmpty()
  @IsString()
  guideType!: string;

  @IsNotEmpty()
  @IsString()
  content!: string;

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
