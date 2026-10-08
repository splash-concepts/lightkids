import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ClassCategoryDocument = ClassCategory & Document;

@Schema({ timestamps: true })
export class ClassCategory {
  @Prop({ required: true })
  name: string; // e.g. "Wisdom Class"

  @Prop()
  description?: string;

  @Prop()
  ageMin?: number;

  @Prop()
  ageMax?: number;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }] })
  mentorIds: Types.ObjectId[];

  @Prop({ type: Types.ObjectId, ref: 'Branch', required: true })
  branchId: Types.ObjectId;
}

export const ClassCategorySchema = SchemaFactory.createForClass(ClassCategory);
