import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { Prisma } from '@prisma/client';

export class UpdateProposedMethodDto {
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