import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type WeeklyQuizDocument = WeeklyQuiz & Document;

@Schema({ _id: false })
export class QuizQuestion {
  @Prop({ required: true })
  question: string;

  @Prop({ type: [String], required: true })
  options: string[];

  @Prop({ required: true, default: 0 })
  correctOptionIndex: number;

  @Prop()
  explanation?: string;
}

export const QuizQuestionSchema = SchemaFactory.createForClass(QuizQuestion);

@Schema({ timestamps: true })
export class WeeklyQuiz {
  @Prop({ required: true })
  title: string;

  @Prop()
  weekNumber?: number;

  @Prop()
  year?: number;

  @Prop({ type: Types.ObjectId, ref: 'ClassCategory' })
  classCategoryId?: Types.ObjectId;

  @Prop()
  biblePassage?: string;

  @Prop()
  memoryVerse?: string;

  @Prop({ required: true })
  sermonNotes: string;

  @Prop({ type: [QuizQuestionSchema], default: [] })
  questions: QuizQuestion[];

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  authorId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Branch' })
  branchId?: Types.ObjectId;

  @Prop({ default: true })
  isPublished: boolean;
}

export const WeeklyQuizSchema = SchemaFactory.createForClass(WeeklyQuiz);
