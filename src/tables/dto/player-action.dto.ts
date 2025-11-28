import { IsEnum, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PlayerAction } from '../../poker/poker.types';

export class PlayerActionDto {
  @ApiProperty({
    enum: PlayerAction,
    example: PlayerAction.CALL,
    description: 'The action to perform: fold, check, call, raise, or all_in',
  })
  @IsEnum(PlayerAction)
  action: PlayerAction;

  @ApiProperty({
    example: 20,
    required: false,
    description: 'The amount to raise (only required for raise action)',
  })
  @IsOptional()
  @IsNumber()
  amount?: number;
}
