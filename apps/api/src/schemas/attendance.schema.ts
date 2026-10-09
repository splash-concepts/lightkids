import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AttendanceDocument = Attendance & Document;

export enum AttendanceStatus {
  PRESENT = 'PRESENT', // Dropped off
  PICKED_UP = 'PICKED_UP', // Picked up (completed)
  ABSENT = 'ABSENT',
}

@Schema({ timestamps: true })
export class Attendance {
  @Prop({ type: Types.ObjectId, ref: 'Child' })
  childId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  userId?: Types.ObjectId; // For Mentor/Staff attendance

  @Prop({ required: true })
  date: Date;

  @Prop({ required: true, enum: AttendanceStatus })
  status: AttendanceStatus;

  @Prop()
  reason?: string; // e.g. "Sick", "Travelled"

  @Prop()
  gender?: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  loggedBy: Types.ObjectId; // Parent or Mentor

  @Prop({ type: Types.ObjectId, ref: 'Branch', required: true })
  branchId: Types.ObjectId;
}

export const AttendanceSchema = SchemaFactory.createForClass(Attendance);
