import { IsEnum, IsOptional, IsString } from 'class-validator';
import { VariableRole, VariableType } from '@prisma/client';

export class UpdateDatasetVariableDto {
  @IsOptional()
  @IsString()
  variableName?: string;

  @IsOptional()
  @IsString()
  variableCode?: string;

  @IsOptional()
  @IsEnum(VariableType)
  variableType?: VariableType;

  @IsOptional()
  @IsEnum(VariableRole)
  variableRole?: VariableRole;

  @IsOptional()
  @IsString()
  scale?: string;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsString()
  collectionMethod?: string;
}