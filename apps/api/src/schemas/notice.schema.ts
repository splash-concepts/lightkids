import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type NoticeDocument = Notice & Document;

export enum NoticeType {
  EVENT = 'EVENT',
  PARENT_UPDATE = 'PARENT_UPDATE',
}

@Schema({ timestamps: true })
export class Notice {
  @Prop({ required: true, enum: NoticeType })
  type: NoticeType;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  content: string;

  @Prop()
  dressCode?: string;

  @Prop()
  eventDate?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  authorId: Types.ObjectId;

  // If target is ADMIN, only admins can see it (used for parent updates)
  @Prop({ default: 'ALL' })
  target: 'ALL' | 'ADMIN';
}

export const NoticeSchema = SchemaFactory.createForClass(Notice);
