import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type HandoffLogDocument = HandoffLog & Document;

export enum HandoffType {
  DROP_OFF = 'DROP_OFF',
  PICK_UP = 'PICK_UP',
}

@Schema({ timestamps: true })
export class HandoffLog {
  @Prop({ type: Types.ObjectId, ref: 'Child', required: true })
  childId: Types.ObjectId;

  @Prop({ required: true, enum: HandoffType })
  type: HandoffType;

  @Prop({ required: true })
  time: Date;

  @Prop({ required: true })
  verifiedByCode: string; // 6-digit code used

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  loggedBy: Types.ObjectId; // User who processed the handoff

  @Prop({ type: Types.ObjectId, ref: 'Branch', required: true })
  branchId: Types.ObjectId;
}

export const HandoffLogSchema = SchemaFactory.createForClass(HandoffLog);
