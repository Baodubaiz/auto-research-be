import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateProposalDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  title?: string;

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