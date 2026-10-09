import { Controller, Post, Body, Get, Param, UseGuards, Req, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AttendanceService } from './attendance.service.js';
import { AttendanceStatus } from '../schemas/attendance.schema.js';

@Controller('attendance')
@UseGuards(AuthGuard('jwt'))
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('mark')
  async markAttendance(@Body() body: { childId?: string, userId?: string, status: AttendanceStatus, reason?: string }, @Req() req: any) {
    if (req.user.role !== 'MENTOR' && req.user.role !== 'ADMIN') {
      throw new UnauthorizedException('Only Mentors and Admins can log attendance');
    }
    return this.attendanceService.markAttendance({
      ...body,
      loggedBy: req.user.userId,
      branchId: req.user.branchId,
    });
  }

  @Post('report-absence')
  async reportAbsence(@Body() body: { childId: string, reason: string }, @Req() req: any) {
    return this.attendanceService.reportAbsence(body.childId, body.reason, req.user.userId, req.user.branchId);
  }

  @Get('class/:classId/:date')
  async getClassAttendance(@Param('classId') classId: string, @Param('date') date: string, @Req() req: any) {
    if (req.user.role !== 'MENTOR' && req.user.role !== 'ADMIN') {
      throw new UnauthorizedException('Only Mentors and Admins can view class attendance');
    }
    return this.attendanceService.getAttendanceForClass(classId, new Date(date), req.user.branchId);
  }
}
