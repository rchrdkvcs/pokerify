import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  username: string;

  @Prop({ required: true, select: false })
  password: string;

  @Prop({ default: 1000 })
  stack: number;
}

export const UserSchema = SchemaFactory.createForClass(User);
