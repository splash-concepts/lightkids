import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type BranchDocument = Branch & Document;

@Schema({ timestamps: true })
export class Branch {
  @Prop({ required: true })
  name: string;

  @Prop()
  location?: string;

  @Prop()
  contactEmail?: string;
}

export const BranchSchema = SchemaFactory.createForClass(Branch);
