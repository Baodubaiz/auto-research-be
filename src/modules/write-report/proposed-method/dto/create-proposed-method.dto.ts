import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { Prisma } from '@prisma/client';

export class CreateProposedMethodDto {
  @IsString()
  documentId!: string;

  @IsOptional()
  @IsString()
  userRequirements?: string;

  @IsOptional()
  researchModel?: Prisma.InputJsonValue;

  @IsOptional()
  hypotheses?: Prisma.InputJsonValue;

  @IsOptional()
  variables?: Prisma.InputJsonValue;

  @IsOptional()
  surveyQuestions?: Prisma.InputJsonValue;

  @IsOptional()
  @IsBoolean()
  isAccepted?: boolean;
}