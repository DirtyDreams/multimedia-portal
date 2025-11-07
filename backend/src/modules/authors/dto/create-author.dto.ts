import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsEmail,
  IsOptional,
  IsUrl,
} from 'class-validator';
import {
  SanitizeHtmlStrict,
  StripHtml,
} from '../../../common/decorators';

export class CreateAuthorDto {
  @ApiProperty({ description: 'Author name', example: 'John Doe' })
  // Remove all HTML tags from name - names should be plain text only
  @StripHtml()
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({
    description: 'Author biography',
    example: 'John Doe is an experienced writer...',
  })
  // Allow only basic HTML formatting (bold, italic) in biography
  @SanitizeHtmlStrict()
  @IsString()
  @IsOptional()
  bio?: string;

  @ApiPropertyOptional({
    description: 'Author email address',
    example: 'john.doe@example.com',
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({
    description: 'Author website URL',
    example: 'https://johndoe.com',
  })
  @IsUrl()
  @IsOptional()
  website?: string;

  @ApiPropertyOptional({
    description: 'Profile image URL',
    example: 'https://example.com/profile.jpg',
  })
  @IsString()
  @IsOptional()
  profileImage?: string;
}
