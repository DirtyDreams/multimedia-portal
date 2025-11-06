import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, Min, Max } from 'class-validator';

export class UpdateRatingDto {
  @ApiProperty({
    description: 'Updated rating value (1-5 stars)',
    example: 4,
    minimum: 1,
    maximum: 5,
  })
  @IsInt()
  @IsNotEmpty()
  @Min(1)
  @Max(5)
  value: number;
}
