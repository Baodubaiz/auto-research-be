import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateReportDto {
  @IsString()
  documentId!: string;

  @IsOptional()
  @IsString()
  contentMarkdown?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  version?: number;
}