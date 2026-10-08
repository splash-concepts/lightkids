import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  MINISTER = 'MINISTER',
  MENTOR = 'MENTOR',
  PARENT = 'PARENT',
}

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password?: string; // Hashed password

  @Prop()
  phoneNumber?: string;

  @Prop()
  whatsappNumber?: string;

  @Prop({ required: true, enum: UserRole })
  role: UserRole;

  @Prop()
  profileImage?: string;

  @Prop()
  twoFactorSecret?: string; // For Mentor 2FA

  @Prop({ default: false })
  isTwoFactorEnabled: boolean;

  @Prop({ type: Types.ObjectId, ref: 'Branch' })
  branchId?: Types.ObjectId; // Optional because SUPER_ADMIN might not have a branch
}

export const UserSchema = SchemaFactory.createForClass(User);
