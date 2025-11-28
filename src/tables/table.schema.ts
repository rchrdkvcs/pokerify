import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Player } from '../players/player.schema';

export type TableDocument = Table & Document;

export enum GamePhase {
  WAITING = 'waiting',
  PRE_FLOP = 'pre_flop',
  FLOP = 'flop',
  TURN = 'turn',
  RIVER = 'river',
  SHOWDOWN = 'showdown',
  FINISHED = 'finished',
}

@Schema({ timestamps: true })
export class Table {
  @Prop({ type: [String], default: [] })
  communityCards: string[];

  @Prop({ type: [Object], default: [] })
  players: Player[];

  @Prop({ default: 0 })
  dealerPosition: number;

  @Prop({ required: true })
  smallBlind: number;

  @Prop({ required: true })
  bigBlind: number;

  @Prop({ default: 0 })
  pot: number;

  @Prop({ type: [String] })
  deck: string[];

  @Prop({ enum: GamePhase, default: GamePhase.WAITING })
  state: GamePhase;

  @Prop({ default: 0 })
  currentPlayerIndex: number;

  @Prop({ default: 0 })
  currentBet: number;

  @Prop({ default: 3, min: 3, max: 8 })
  maxPlayers: number;
}

export const TableSchema = SchemaFactory.createForClass(Table);
