import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ChildDocument = Child & Document;

@Schema({ timestamps: true })
export class Child {
  @Prop({ required: true })
  name: string;

  @Prop()
  profileImage?: string;

  @Prop({ required: true })
  dob: Date; // Important for age cross promotions

  @Prop({ type: Types.ObjectId, ref: 'ClassCategory' })
  classCategoryId: Types.ObjectId;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }] })
  parentIds: Types.ObjectId[];

  @Prop({ type: [String] })
  caregiverImages: string[]; // Legacy/Generic URLs for nanny/self images

  @Prop({ type: [{ name: String, relation: String, image: String }] })
  caregivers: Array<{ name: string; relation: string; image: string }>;

  @Prop({ required: true, unique: true })
  uniqueCode: string; // 6-digit code for handoff

  @Prop({ type: Object })
  medicalInfo: {
    allergies: string[];
    medications: string[];
    emergencyContacts: Array<{ name: string; phone: string; relation: string }>;
  };

  @Prop({ type: Types.ObjectId, ref: 'Branch', required: true })
  branchId: Types.ObjectId;
}

export const ChildSchema = SchemaFactory.createForClass(Child);
