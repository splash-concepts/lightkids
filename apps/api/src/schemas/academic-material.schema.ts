import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AcademicMaterialDocument = AcademicMaterial & Document;

export enum MaterialType {
  ASSIGNMENT = 'ASSIGNMENT',
  PROJECT = 'PROJECT',
  SERMON_NOTE = 'SERMON_NOTE',
}

@Schema({ timestamps: true })
export class AcademicMaterial {
  @Prop({ type: Types.ObjectId, ref: 'ClassCategory', required: true })
  classCategoryId: Types.ObjectId;

  @Prop({ required: true, enum: MaterialType })
  type: MaterialType;

  @Prop({ required: true })
  title: string;

  @Prop()
  content?: string; // For text-based notes

  @Prop()
  fileUrl?: string; // For uploaded files

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  authorId: Types.ObjectId; // Mentor who uploaded it

  @Prop({ type: Types.ObjectId, ref: 'Branch', required: true })
  branchId: Types.ObjectId;
}

export const AcademicMaterialSchema = SchemaFactory.createForClass(AcademicMaterial);
