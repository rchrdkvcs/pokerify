import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PlayerDocument = Player & Document;

export enum PlayerStatus {
  ACTIVE = 'active',
  FOLDED = 'folded',
  ALL_IN = 'all_in',
  SITTING_OUT = 'sitting_out',
}

export enum PlayerType {
  HUMAN = 'human',
  AI = 'ai',
}

@Schema()
export class Player {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  username: string;

  @Prop({ required: true, enum: PlayerType })
  type: PlayerType;

  @Prop({ required: true })
  stack: number;

  @Prop({ default: 0 })
  currentBet: number;

  @Prop({ type: [String], default: [] })
  cards: string[];

  @Prop({ required: true })
  position: number;

  @Prop({ required: true, enum: PlayerStatus, default: PlayerStatus.ACTIVE })
  status: PlayerStatus;

  @Prop({ default: false })
  isDealer: boolean;

  @Prop({ default: false })
  hasActed: boolean;
}

export const PlayerSchema = SchemaFactory.createForClass(Player);
