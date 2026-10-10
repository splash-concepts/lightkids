import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type ArchiveDocument = Archive & Document;

@Schema({ timestamps: true })
export class Archive {
  @Prop({ required: true })
  entityType: string;

  @Prop({ required: true })
  originalId: string;

  @Prop({ type: MongooseSchema.Types.Mixed, required: true })
  data: any;

  @Prop()
  archivedBy?: string;
}

export const ArchiveSchema = SchemaFactory.createForClass(Archive);
