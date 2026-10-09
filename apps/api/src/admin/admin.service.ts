import { Injectable } from '@nestjs/common';
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

    const attendanceFilter: any = {
      date: { $gte: startOfDay, $lte: endOfDay },
      status: AttendanceStatus.PRESENT
    };
    if (branchId) attendanceFilter.branchId = branchId;

    const presentToday = await this.attendanceModel.countDocuments(attendanceFilter);

    return { totalParents, totalMentors, totalChildren, presentToday };
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

  async updateUserRole(userId: string, role: string) {
    return this.userModel.findByIdAndUpdate(userId, { role }, { new: true });
  }
}
