import { IsDefined, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Prisma } from '@prisma/client';

export class CreateOutlineDto {
  @IsString()
  documentId!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  totalWordCount?: number;

  @IsDefined()
  structure!: Prisma.InputJsonValue;
}