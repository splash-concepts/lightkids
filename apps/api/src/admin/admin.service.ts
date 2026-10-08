import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument, UserRole } from '../schemas/user.schema.js';
import { Child, ChildDocument } from '../schemas/child.schema.js';
import { Attendance, AttendanceDocument, AttendanceStatus } from '../schemas/attendance.schema.js';
import { AcademicMaterial, AcademicMaterialDocument } from '../schemas/academic-material.schema.js';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Child.name) private childModel: Model<ChildDocument>,
    @InjectModel(Attendance.name) private attendanceModel: Model<AttendanceDocument>,
    @InjectModel(AcademicMaterial.name) private materialModel: Model<AcademicMaterialDocument>
  ) {}

  async getStats() {
    const totalParents = await this.userModel.countDocuments({ role: UserRole.PARENT });
    const totalMentors = await this.userModel.countDocuments({ role: UserRole.MENTOR });
    const totalChildren = await this.childModel.countDocuments();
    
    // Calculate attendance for today
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const presentToday = await this.attendanceModel.countDocuments({
      date: { $gte: startOfDay, $lte: endOfDay },
      status: AttendanceStatus.PRESENT
    });

    return { totalParents, totalMentors, totalChildren, presentToday };
  }

  async getUsers(role?: string) {
    const filter: any = role ? { role } : {};
    return this.userModel.find(filter).select('-password').sort({ createdAt: -1 });
  }

  async getChildren() {
    return this.childModel.find().populate('classCategoryId').populate('parentIds', 'name email').sort({ createdAt: -1 });
  }

  async getChild(id: string) {
    const child = await this.childModel.findById(id).populate('classCategoryId').populate('parentIds', 'name email');
    const attendance = await this.attendanceModel.find({ childId: id }).sort({ date: -1 });
    return { child, attendance };
  }

  async getAttendanceHistory() {
    return this.attendanceModel.find().populate('childId').populate('markedBy').sort({ date: -1 }).limit(100);
  }
}
