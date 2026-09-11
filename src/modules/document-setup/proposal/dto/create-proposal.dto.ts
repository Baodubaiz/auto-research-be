import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateProposalDto {
  @IsString()
  documentId!: string;

  @IsString()
  @MinLength(1)
  title!: string;

  @IsOptional()
  @IsString()
  problemStatement?: string;

  @IsOptional()
  @IsString()
  motivation?: string;

  @IsOptional()
  @IsBoolean()
  isSelected?: boolean;
}