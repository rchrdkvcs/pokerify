import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TableDocument = Table & Document;

@Schema({ timestamps: true })
export class Table {
  @Prop()
  communityCards: string[];

  @Prop()
  players: string[];

  @Prop()
  dealerPosition: number;

  @Prop()
  smallBlind: number;

  @Prop()
  bigBlind: number;

  @Prop()
  pot: number;

  @Prop({ select: false })
  deck: string[];

  @Prop()
  state: string;
}

export const TableSchema = SchemaFactory.createForClass(Table);
