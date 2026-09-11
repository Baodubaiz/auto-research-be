import { IsDefined, IsInt, IsOptional, Min } from 'class-validator';
import { Prisma } from '@prisma/client';

export class UpdateOutlineDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  totalWordCount?: number;

  @IsOptional()
  @IsDefined()
  structure?: Prisma.InputJsonValue;
}