import { IsString } from 'class-validator';

export class AttachReferenceDto {
  @IsString()
  referenceId!: string;
}