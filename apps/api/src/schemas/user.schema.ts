import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

export enum UserRole {
  ADMIN = 'ADMIN',
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

  @Prop({ required: true, enum: UserRole })
  role: UserRole;

  @Prop()
  profileImage?: string;

  @Prop()
  twoFactorSecret?: string; // For Mentor 2FA

  @Prop({ default: false })
  isTwoFactorEnabled: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);
