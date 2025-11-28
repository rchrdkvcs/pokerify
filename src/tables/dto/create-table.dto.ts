import { IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTableDto {
  @ApiProperty({ example: 5, minimum: 1, description: 'Small blind amount' })
  @IsNumber()
  @Min(1)
  smallBlind: number;

  @ApiProperty({
    example: 10,
    minimum: 2,
    description: 'Big blind amount (must be at least 2)',
  })
  @IsNumber()
  @Min(2)
  bigBlind: number;
}
