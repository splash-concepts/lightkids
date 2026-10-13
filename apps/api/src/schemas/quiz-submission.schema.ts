import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type QuizSubmissionDocument = QuizSubmission & Document;

@Schema({ timestamps: true })
export class QuizSubmission {
  @Prop({ type: Types.ObjectId, ref: 'WeeklyQuiz', required: true })
  quizId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Child', required: true })
  childId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  submittedBy: Types.ObjectId;

  @Prop({ type: [Number], required: true })
  answers: number[];

  @Prop({ required: true })
  score: number;

  @Prop({ required: true })
  totalQuestions: number;

  @Prop({ required: true })
  percentage: number;
}

export const QuizSubmissionSchema = SchemaFactory.createForClass(QuizSubmission);
