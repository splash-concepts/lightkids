import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ServiceLinkDocument = ServiceLink & Document;

@Schema({ timestamps: true })
export class ServiceLink {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  url: string;

  @Prop({ type: Types.ObjectId, ref: 'Branch' })
  branchId: Types.ObjectId;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }] })
  viewedBy: Types.ObjectId[];
}

export const ServiceLinkSchema = SchemaFactory.createForClass(ServiceLink);
