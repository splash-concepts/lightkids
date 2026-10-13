import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { QuizzesService } from './quizzes.service.js';
import { QuizzesController } from './quizzes.controller.js';
import { WeeklyQuiz, WeeklyQuizSchema } from '../schemas/weekly-quiz.schema.js';
import { QuizSubmission, QuizSubmissionSchema } from '../schemas/quiz-submission.schema.js';
import { Child, ChildSchema } from '../schemas/child.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: WeeklyQuiz.name, schema: WeeklyQuizSchema },
      { name: QuizSubmission.name, schema: QuizSubmissionSchema },
      { name: Child.name, schema: ChildSchema },
    ]),
  ],
  controllers: [QuizzesController],
  providers: [QuizzesService],
  exports: [QuizzesService],
})
export class QuizzesModule {}
