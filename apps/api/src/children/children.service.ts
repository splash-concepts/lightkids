import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Child, ChildDocument } from '../schemas/child.schema.js';
import { ClassCategory, ClassCategoryDocument } from '../schemas/class-category.schema.js';
import { Attendance, AttendanceDocument } from '../schemas/attendance.schema.js';
import { AcademicMaterial, AcademicMaterialDocument } from '../schemas/academic-material.schema.js';

@Injectable()
export class ChildrenService {
  constructor(
    @InjectModel(Child.name) private childModel: Model<ChildDocument>,
    @InjectModel(ClassCategory.name) private classCategoryModel: Model<ClassCategoryDocument>,
    @InjectModel(Attendance.name) private attendanceModel: Model<AttendanceDocument>,
    @InjectModel(AcademicMaterial.name) private materialModel: Model<AcademicMaterialDocument>
  ) {}

  async getCategories(branchId: string, mentorId?: string) {
    const filter: any = { $or: [{ branchId }, { branchId: { $exists: false } }, { branchId: null }] };
    if (mentorId) {
      filter.mentorIds = mentorId;
    }
    return this.classCategoryModel.find(filter).sort({ name: 1 });
  }

  async registerChild(data: any, userId: string, role: string, branchId: string) {
    // Generate a unique 6-digit code
    const uniqueCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Auto-link parent if a PARENT is doing the registration
    if (role === 'PARENT' && !data.parentIds?.includes(userId)) {
      data.parentIds = [...(data.parentIds || []), userId];
    }

    if (data.dob && !data.classCategoryId) {
      const today = new Date();
      const ageInYears = (today.getTime() - new Date(data.dob).getTime()) / (1000 * 3600 * 24 * 365.25);
      const categories = await this.classCategoryModel.find({ branchId });
      const matchedCategory = categories.find(c => ageInYears >= (c.ageMin || 0) && ageInYears < (c.ageMax ? c.ageMax + 1 : 999));
      if (matchedCategory) {
        data.classCategoryId = matchedCategory._id;
      }
    }

    const child = await this.childModel.create({
      ...data,
      uniqueCode,
      branchId,
    });
    return child;
  }

  async getPromotableChildren(branchId: string) {
    const children = await this.childModel.find({ branchId }).populate('classCategoryId');
    const today = new Date();
    
    return children.filter(child => {
      const ageInYears = (today.getTime() - new Date(child.dob).getTime()) / (1000 * 3600 * 24 * 365.25);
      const category: any = child.classCategoryId;
      
      if (!category) return false;
      if (category.ageMax && ageInYears >= (category.ageMax + 1)) return true;
      return false;
    });
  }

  async promoteChild(childId: string, newClassCategoryId: string, note?: string, teacherId?: string) {
    const updatePayload: any = { classCategoryId: newClassCategoryId };
    if (note && teacherId) {
      updatePayload.$push = { teacherNotes: { note, date: new Date(), teacherId } };
    }
    return this.childModel.findByIdAndUpdate(childId, updatePayload, { new: true });
  }

  async getChildrenByParent(parentId: string) {
    const kids = await this.childModel.find({ parentIds: parentId }).populate('classCategoryId').lean();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    for (const kid of kids) {
      const attendance = await this.attendanceModel.findOne({
        childId: kid._id,
        date: { $gte: today, $lte: endOfDay }
      }).sort({ date: -1 });
      if (attendance) {
        (kid as any).todayAttendanceStatus = attendance.status;
      }
    }
    return kids;
  }

  async getChildrenByClass(classCategoryId: string) {
    return this.childModel.find({ classCategoryId }).populate('parentIds', 'name email phoneNumber whatsappNumber');
  }

  async getChildProfile(childId: string, userId: string, role: string) {
    const child = await this.childModel.findById(childId).populate('classCategoryId').populate('parentIds', 'name email');
    if (!child) throw new NotFoundException('Child not found');
    
    if (role === 'PARENT' && !child.parentIds.some((p: any) => p._id.toString() === userId)) {
      throw new UnauthorizedException('Not authorized to view this child');
    }

    const attendance = await this.attendanceModel.find({ childId }).sort({ date: -1 });
    let materials: any[] = [];
    if (child.classCategoryId) {
      materials = await this.materialModel.find({ classCategoryId: child.classCategoryId._id }).sort({ createdAt: -1 });
    }
    const classes = await this.classCategoryModel.find({ branchId: child.branchId });

    return { child, attendance, materials, classes };
  }

  async updateChild(childId: string, data: any, userId: string, role: string) {
    const child = await this.childModel.findById(childId);
    if (!child) throw new NotFoundException('Child not found');

    if (role === 'PARENT' && !child.parentIds.some((p: any) => p._id.toString() === userId)) {
      throw new UnauthorizedException('Not authorized to update this child');
    }

    // Auto-assign class if dob is provided and class is unassigned or provided
    if (data.dob && !data.classCategoryId) {
      const today = new Date();
      const ageInYears = (today.getTime() - new Date(data.dob).getTime()) / (1000 * 3600 * 24 * 365.25);
      const categories = await this.classCategoryModel.find({ branchId: child.branchId });
      const matchedCategory = categories.find(c => ageInYears >= (c.ageMin || 0) && ageInYears < (c.ageMax ? c.ageMax + 1 : 999));
      if (matchedCategory) {
        data.classCategoryId = matchedCategory._id;
      }
    }

    return this.childModel.findByIdAndUpdate(childId, { $set: data }, { new: true });
  }
}
