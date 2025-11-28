import { IsEnum, IsNumber, IsString } from 'class-validator';
import { PlayerType } from '../player.schema';

export class CreatePlayerDto {
  @IsString()
  userId: string;

  @IsString()
  username: string;

  @IsEnum(PlayerType)
  type: PlayerType;

  @IsNumber()
  stack: number;

  @IsNumber()
  position: number;
}
