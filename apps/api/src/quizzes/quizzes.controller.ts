import { Controller, Post, Get, Delete, Body, Param, Query, UseGuards, Req, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { QuizzesService } from './quizzes.service.js';

@Controller('quizzes')
@UseGuards(AuthGuard('jwt'))
export class QuizzesController {
  constructor(private readonly quizzesService: QuizzesService) {}

  @Post()
  async createQuiz(@Body() body: any, @Req() req: any) {
    if (req.user.role !== 'MENTOR' && req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      throw new UnauthorizedException('Only Mentors and Admins can create quizzes');
    }
    return this.quizzesService.createQuiz(body, req.user.userId || req.user.sub, req.user.branchId);
  }

  @Get()
  async getQuizzes(@Query('classCategoryId') classCategoryId: string, @Req() req: any) {
    const isMentorOrAdmin = req.user.role === 'MENTOR' || req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN';
    return this.quizzesService.getQuizzes(classCategoryId, req.user.branchId, isMentorOrAdmin);
  }

  @Get(':id')
  async getQuiz(@Param('id') id: string) {
    return this.quizzesService.getQuizById(id);
  }

  @Post(':id/submit')
  async submitQuiz(@Param('id') id: string, @Body() body: { childId: string; answers: number[] }, @Req() req: any) {
    const userId = req.user.userId || req.user.sub;
    return this.quizzesService.submitQuiz(id, body.childId, userId, body.answers);
  }

  @Get(':id/my-submission')
  async getMySubmission(@Param('id') id: string, @Query('childId') childId: string) {
    return this.quizzesService.getSubmissionForChild(id, childId);
  }

  @Get(':id/submissions')
  async getSubmissions(@Param('id') id: string, @Req() req: any) {
    if (req.user.role !== 'MENTOR' && req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      throw new UnauthorizedException('Only Mentors and Admins can view submission statistics');
    }
    return this.quizzesService.getSubmissionsForQuiz(id);
  }

  @Delete(':id')
  async deleteQuiz(@Param('id') id: string, @Req() req: any) {
    if (req.user.role !== 'MENTOR' && req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      throw new UnauthorizedException('Only Mentors and Admins can delete quizzes');
    }
    return this.quizzesService.deleteQuiz(id);
  }
}
