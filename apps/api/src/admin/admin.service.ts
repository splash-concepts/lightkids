import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument, UserRole } from '../schemas/user.schema.js';
import { Child, ChildDocument } from '../schemas/child.schema.js';
import { Attendance, AttendanceDocument, AttendanceStatus } from '../schemas/attendance.schema.js';
import { AcademicMaterial, AcademicMaterialDocument } from '../schemas/academic-material.schema.js';
import { Branch, BranchDocument } from '../schemas/branch.schema.js';
import { ClassCategory, ClassCategoryDocument } from '../schemas/class-category.schema.js';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Child.name) private childModel: Model<ChildDocument>,
    @InjectModel(Attendance.name) private attendanceModel: Model<AttendanceDocument>,
    @InjectModel(AcademicMaterial.name) private materialModel: Model<AcademicMaterialDocument>,
    @InjectModel(Branch.name) private branchModel: Model<BranchDocument>,
    @InjectModel(ClassCategory.name) private classCategoryModel: Model<ClassCategoryDocument>
  ) {}

  async getStats(branchId?: string) {
    const filter = branchId ? { branchId } : {};
    const userFilter = branchId ? { branchId, role: UserRole.PARENT } : { role: UserRole.PARENT };
    const mentorFilter = branchId ? { branchId, role: UserRole.MENTOR } : { role: UserRole.MENTOR };

    const totalParents = await this.userModel.countDocuments(userFilter);
    const totalMentors = await this.userModel.countDocuments(mentorFilter);
    const totalChildren = await this.childModel.countDocuments(filter);
    
    // Calculate attendance for today
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const presentOrPickedUp = [AttendanceStatus.PRESENT, AttendanceStatus.PICKED_UP];

    // Chart Data (Last 6 Months Trend)
    const attendanceTrend = await this.attendanceModel.aggregate([
      { $match: branchId ? { branchId } : {} },
      { $group: {
        _id: { $dateToString: { format: "%Y-%m", date: "$date" } },
        Presents: { $sum: { $cond: [{ $in: ["$status", presentOrPickedUp] }, 1, 0] } }
      }},
      { $sort: { _id: 1 } },
      { $limit: 6 }
    ]);
    
    const chartData = attendanceTrend.length > 0 ? attendanceTrend.map(t => ({ name: t._id, Presents: t.Presents })) : [{ name: 'No Data', Presents: 0 }];

    // Today's Detailed Stats
    const allMentors = await this.userModel.find({ role: UserRole.MENTOR, ...(branchId && { branchId }) });
    const mentorAttendanceToday = await this.attendanceModel.find({
      date: { $gte: startOfDay, $lte: endOfDay },
      userId: { $exists: true },
      ...(branchId && { branchId })
    });
    
    // Mentor stats
    const presentMentorIds = mentorAttendanceToday.filter(a => presentOrPickedUp.includes(a.status)).map(a => a.userId?.toString());
    const absentMentors = allMentors.filter(m => !presentMentorIds.includes(m._id.toString()));

    // Kids stats
    const allKids = await this.childModel.find(branchId ? { branchId } : {}).populate('parentIds', 'name email phoneNumber whatsappNumber');
    const kidAttendanceToday = await this.attendanceModel.find({
      date: { $gte: startOfDay, $lte: endOfDay },
      childId: { $exists: true },
      ...(branchId && { branchId })
    }).populate({
      path: 'childId',
      populate: [
        { path: 'parentIds', select: 'name email phoneNumber whatsappNumber' },
        { path: 'classCategoryId' }
      ]
    });
    
    const presentKidIds = kidAttendanceToday.filter(a => presentOrPickedUp.includes(a.status)).map(a => a.childId?._id?.toString() || a.childId?.toString());
    const absentKids = allKids.filter(k => !presentKidIds.includes(k._id.toString()));

    const presentKidsData = kidAttendanceToday.filter(a => a.status === AttendanceStatus.PRESENT).map(a => a.childId);
    const pickedUpKidsData = kidAttendanceToday.filter(a => a.status === AttendanceStatus.PICKED_UP).map(a => a.childId);
    const totalPresentAndPickedUp = presentKidsData.length + pickedUpKidsData.length;

    return { 
      totalParents, totalMentors, totalChildren, 
      presentToday: totalPresentAndPickedUp, 
      chartData,
      today: {
        absentMentors,
        absentKids,
        presentKids: presentKidsData,
        pickedUpKids: pickedUpKidsData,
      }
    };
  }

  async getUsers(role?: string, branchId?: string) {
    const filter: any = {};
    if (role) filter.role = role;
    if (branchId) filter.branchId = branchId;
    return this.userModel.find(filter).select('-password').sort({ createdAt: -1 });
  }

  async getUserProfile(id: string) {
    const user = await this.userModel.findById(id).select('-password');
    if (!user) return null;
    
    let children: any[] = [];
    let classes: any[] = [];
    
    if (user.role === UserRole.PARENT) {
      children = await this.childModel.find({ parentIds: user._id }).populate('classCategoryId');
    } else if (user.role === UserRole.MENTOR) {
      classes = await this.classCategoryModel.find({ mentorIds: user._id });
    }
    
    return { user, children, classes };
  }

  async getChildren(branchId?: string) {
    const filter = branchId ? { branchId } : {};
    return this.childModel.find(filter).populate('classCategoryId').populate('parentIds', 'name email phoneNumber whatsappNumber').sort({ createdAt: -1 });
  }

  async getChild(id: string) {
    const child = await this.childModel.findById(id).populate('classCategoryId').populate('parentIds', 'name email phoneNumber whatsappNumber');
    const attendance = await this.attendanceModel.find({ childId: id }).sort({ date: -1 });
    return { child, attendance };
  }

  async getAttendanceHistory(branchId?: string) {
    const filter = branchId ? { branchId } : {};
    return this.attendanceModel.find(filter).populate('childId').populate('markedBy').sort({ date: -1 }).limit(100);
  }

  // Multi-Tenancy / Branch Management
  async createBranch(data: { name: string; location?: string; contactEmail?: string }) {
    const branch = await this.branchModel.create(data);
    
    // Seed default class categories for the new branch
    const defaultClasses = [
      { name: 'Wisdom class', description: 'Ages 1-3', branchId: branch._id, ageMin: 1, ageMax: 3 },
      { name: 'Victory class', description: 'Ages 4-6', branchId: branch._id, ageMin: 4, ageMax: 6 },
      { name: 'Faith class', description: 'Ages 7-9', branchId: branch._id, ageMin: 7, ageMax: 9 },
      { name: 'Light class', description: 'Ages 10-12', branchId: branch._id, ageMin: 10, ageMax: 12 },
    ];
    await this.classCategoryModel.insertMany(defaultClasses);
    
    return branch;
  }

  async getBranches() {
    return this.branchModel.find().sort({ createdAt: -1 });
  }

  // Class Management per Branch
  async createClassCategory(data: { name: string; description?: string; branchId: string; ageMin?: number; ageMax?: number }) {
    return this.classCategoryModel.create(data);
  }

  async getClassCategories(branchId?: string) {
    const filter = branchId ? { branchId } : {};
    return this.classCategoryModel.find(filter).populate('mentorIds', 'name email').sort({ name: 1 });
  }

  async updateClassCategory(id: string, data: { name?: string; description?: string; mentorIds?: string[]; ageMin?: number; ageMax?: number }, branchId: string) {
    // We enforce branchId to ensure an Admin can only edit classes in their branch
    return this.classCategoryModel.findOneAndUpdate(
      { _id: id, branchId },
      { $set: data },
      { new: true }
    );
  }

  async deleteClassCategory(id: string, branchId: string, isSuperAdmin: boolean) {
    const filter: any = { _id: id };
    if (!isSuperAdmin) filter.branchId = branchId;
    const deleted = await this.classCategoryModel.findOneAndDelete(filter);
    if (deleted) {
      // Unassign children from this class
      await this.childModel.updateMany({ classCategoryId: id }, { $unset: { classCategoryId: "" } });
    }
    return { success: !!deleted };
  }

  // User Management
  async transferUserBranch(userId: string, newBranchId: string) {
    const user = await this.userModel.findByIdAndUpdate(userId, { branchId: newBranchId }, { new: true });
    
    if (user && user.role === UserRole.PARENT) {
      // Transfer all children of this parent to the new branch
      await this.childModel.updateMany(
        { parentIds: userId },
        { $set: { branchId: newBranchId } }
      );
    }
    
    return user;
  }

  async updateUserRole(userId: string, updateData: { role?: string; office?: string }, actorRole: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    if (actorRole === 'ADMIN') {
      if (user.role === 'SUPER_ADMIN' || user.role === 'MINISTER') {
        throw new UnauthorizedException('Admin cannot modify SUPER_ADMIN or MINISTER accounts');
      }
      if (updateData.role === 'SUPER_ADMIN' || updateData.role === 'MINISTER') {
        throw new UnauthorizedException('Admin cannot assign SUPER_ADMIN or MINISTER roles');
      }
    }

    if (updateData.role) user.role = updateData.role as UserRole;
    if (updateData.office !== undefined) user.office = updateData.office;

    return user.save();
  }

  async assignClassesToMentor(userId: string, classIds: string[], branchId: string, isSuperAdmin: boolean) {
    const branchFilter = isSuperAdmin ? {} : { branchId };
    
    // First, remove mentor from all classes in the applicable scope
    await this.classCategoryModel.updateMany(
      { ...branchFilter, mentorIds: userId },
      { $pull: { mentorIds: userId } }
    );
    
    // Then, add mentor to the specified classes
    if (classIds && classIds.length > 0) {
      await this.classCategoryModel.updateMany(
        { _id: { $in: classIds }, ...branchFilter },
        { $addToSet: { mentorIds: userId } }
      );
    }
    
    return { success: true };
  }
}
