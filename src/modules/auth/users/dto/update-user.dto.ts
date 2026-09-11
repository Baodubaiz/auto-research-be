import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  userName?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  fullName?: string;
}