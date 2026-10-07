import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AttendanceDocument = Attendance & Document;

export enum AttendanceStatus {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
}

@Schema({ timestamps: true })
export class Attendance {
  @Prop({ type: Types.ObjectId, ref: 'Child', required: true })
  childId: Types.ObjectId;

  @Prop({ required: true })
  date: Date;

  @Prop({ required: true, enum: AttendanceStatus })
  status: AttendanceStatus;

  @Prop()
  reason?: string; // e.g. "Sick", "Travelled"

  @Prop({ type: Types.ObjectId, ref: 'User' })
  loggedBy: Types.ObjectId; // Parent or Mentor
}

export const AttendanceSchema = SchemaFactory.createForClass(Attendance);
