import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Attendance, AttendanceDocument, AttendanceStatus } from '../schemas/attendance.schema.js';

@Injectable()
export class AttendanceService {
  constructor(@InjectModel(Attendance.name) private attendanceModel: Model<AttendanceDocument>) {}

  async markAttendance(data: { childId?: string; userId?: string; status: AttendanceStatus; reason?: string; loggedBy: string; branchId: string }) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const filter: any = { date: { $gte: today } };
    if (data.childId) filter.childId = data.childId;
    if (data.userId) filter.userId = data.userId;

    // Update if already marked today, otherwise create new
    return this.attendanceModel.findOneAndUpdate(
      filter,
      { ...data, date: new Date() },
      { upsert: true, new: true }
    );
  }

  async getAttendanceForClass(classId: string, date: Date, branchId: string) {
    const records = await this.attendanceModel.find({ branchId, date: { $gte: date } }).populate({
      path: 'childId',
      match: { classCategoryId: classId },
    });
    return records.filter(record => record.childId !== null);
  }

  async reportAbsence(childId: string, reason: string, parentId: string, branchId: string) {
    return this.markAttendance({
      childId,
      status: AttendanceStatus.ABSENT,
      reason,
      loggedBy: parentId,
      branchId,
    });
  }
}
