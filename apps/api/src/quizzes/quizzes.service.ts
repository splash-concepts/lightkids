import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { WeeklyQuiz, WeeklyQuizDocument } from '../schemas/weekly-quiz.schema.js';
import { QuizSubmission, QuizSubmissionDocument } from '../schemas/quiz-submission.schema.js';
import { Child, ChildDocument } from '../schemas/child.schema.js';

@Injectable()
export class QuizzesService {
  constructor(
    @InjectModel(WeeklyQuiz.name) private quizModel: Model<WeeklyQuizDocument>,
    @InjectModel(QuizSubmission.name) private submissionModel: Model<QuizSubmissionDocument>,
    @InjectModel(Child.name) private childModel: Model<ChildDocument>
  ) {}

  async createQuiz(data: any, authorId: string, branchId?: string) {
    const { title, weekNumber, year, classCategoryId, biblePassage, memoryVerse, sermonNotes, questions } = data;

    if (!title || !sermonNotes) {
      throw new BadRequestException('Title and Sermon Notes are required');
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      throw new BadRequestException('At least one multiple-choice question is required');
    }

    const validatedQuestions = questions.map((q: any, idx: number) => {
      if (!q.question || !Array.isArray(q.options) || q.options.length < 2) {
        throw new BadRequestException(`Question ${idx + 1} must have text and at least 2 options`);
      }
      const correctIdx = typeof q.correctOptionIndex === 'number' ? q.correctOptionIndex : 0;
      if (correctIdx < 0 || correctIdx >= q.options.length) {
        throw new BadRequestException(`Question ${idx + 1} correct answer index is out of bounds`);
      }
      return {
        question: q.question.trim(),
        options: q.options.map((opt: string) => opt.trim()),
        correctOptionIndex: correctIdx,
        explanation: q.explanation || '',
      };
    });

    return this.quizModel.create({
      title: title.trim(),
      weekNumber: weekNumber ? parseInt(weekNumber, 10) : undefined,
      year: year ? parseInt(year, 10) : new Date().getFullYear(),
      classCategoryId: classCategoryId && Types.ObjectId.isValid(classCategoryId) ? new Types.ObjectId(classCategoryId) : undefined,
      biblePassage: biblePassage?.trim(),
      memoryVerse: memoryVerse?.trim(),
      sermonNotes,
      questions: validatedQuestions,
      authorId: new Types.ObjectId(authorId),
      branchId: branchId && Types.ObjectId.isValid(branchId) ? new Types.ObjectId(branchId) : undefined,
      isPublished: true,
    });
  }

  async getQuizzes(classCategoryId?: string, branchId?: string, isMentorOrAdmin: boolean = false) {
    const filter: any = {};
    if (!isMentorOrAdmin) {
      filter.isPublished = true;
    }

    if (classCategoryId && Types.ObjectId.isValid(classCategoryId)) {
      filter.$or = [
        { classCategoryId: new Types.ObjectId(classCategoryId) },
        { classCategoryId: { $exists: false } },
        { classCategoryId: null },
      ];
    }

    if (branchId && Types.ObjectId.isValid(branchId)) {
      filter.$and = [
        ...(filter.$and || []),
        {
          $or: [
            { branchId: new Types.ObjectId(branchId) },
            { branchId: { $exists: false } },
            { branchId: null },
          ]
        }
      ];
    }

    return this.quizModel
      .find(filter)
      .populate('classCategoryId', 'name')
      .populate('authorId', 'name email role')
      .sort({ createdAt: -1 });
  }

  async getQuizById(id: string) {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Invalid Quiz ID');
    const quiz = await this.quizModel
      .findById(id)
      .populate('classCategoryId', 'name')
      .populate('authorId', 'name email role');
    if (!quiz) throw new NotFoundException('Quiz not found');
    return quiz;
  }

  async submitQuiz(quizId: string, childId: string, submittedBy: string, answers: number[]) {
    if (!Types.ObjectId.isValid(quizId) || !Types.ObjectId.isValid(childId)) {
      throw new BadRequestException('Invalid IDs provided');
    }

    const quiz = await this.quizModel.findById(quizId);
    if (!quiz) throw new NotFoundException('Quiz not found');

    const totalQuestions = quiz.questions.length;
    let score = 0;

    const review = quiz.questions.map((q, idx) => {
      const selectedOptionIndex = typeof answers[idx] === 'number' ? answers[idx] : -1;
      const isCorrect = selectedOptionIndex === q.correctOptionIndex;
      if (isCorrect) score += 1;

      return {
        questionNumber: idx + 1,
        question: q.question,
        options: q.options,
        selectedOptionIndex,
        selectedOption: q.options[selectedOptionIndex] || 'No answer',
        correctOptionIndex: q.correctOptionIndex,
        correctOption: q.options[q.correctOptionIndex],
        isCorrect,
        explanation: q.explanation || '',
      };
    });

    const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;

    const submission = await this.submissionModel.findOneAndUpdate(
      { quizId: new Types.ObjectId(quizId), childId: new Types.ObjectId(childId) },
      {
        quizId: new Types.ObjectId(quizId),
        childId: new Types.ObjectId(childId),
        submittedBy: new Types.ObjectId(submittedBy),
        answers,
        score,
        totalQuestions,
        percentage,
      },
      { upsert: true, new: true }
    );

    return {
      submission,
      score,
      totalQuestions,
      percentage,
      review,
    };
  }

  async getSubmissionForChild(quizId: string, childId: string) {
    if (!Types.ObjectId.isValid(quizId) || !Types.ObjectId.isValid(childId)) return null;
    return this.submissionModel.findOne({
      quizId: new Types.ObjectId(quizId),
      childId: new Types.ObjectId(childId),
    });
  }

  async getSubmissionsForQuiz(quizId: string) {
    if (!Types.ObjectId.isValid(quizId)) throw new NotFoundException('Invalid Quiz ID');
    return this.submissionModel
      .find({ quizId: new Types.ObjectId(quizId) })
      .populate('childId', 'name uniqueCode profileImage')
      .populate('submittedBy', 'name email role')
      .sort({ score: -1, createdAt: -1 });
  }

  async deleteQuiz(id: string) {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Invalid Quiz ID');
    await this.submissionModel.deleteMany({ quizId: new Types.ObjectId(id) });
    return this.quizModel.findByIdAndDelete(id);
  }
}
