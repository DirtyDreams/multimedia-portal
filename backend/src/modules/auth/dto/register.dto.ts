import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { StripHtml } from '../../../common/decorators';

export class RegisterDto {
  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'User email address',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'johndoe',
    description: 'Unique username',
    minLength: 3,
    maxLength: 30,
  })
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  @StripHtml() // Remove any HTML from username
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message: 'Username can only contain letters, numbers, hyphens and underscores',
  })
  username: string;

  @ApiProperty({
    example: 'SecurePassword123!',
    description:
      'User password (8-128 characters, must include uppercase, lowercase, number, and special character)',
    minLength: 8,
    maxLength: 128,
  })
  @IsString()
  @MinLength(8, {
    message: 'Password must be at least 8 characters long',
  })
  @MaxLength(128, {
    message: 'Password must not exceed 128 characters',
  })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      'Password must contain at least 8 characters, including uppercase, lowercase, number, and special character (@$!%*?&)',
  })
  password: string;

  @ApiProperty({
    example: 'John Doe',
    description: 'User full name',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @StripHtml() // Remove any HTML from name
  name?: string;
}
