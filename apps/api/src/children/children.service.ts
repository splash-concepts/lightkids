import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Child, ChildDocument } from '../schemas/child.schema.js';
import { ClassCategory, ClassCategoryDocument } from '../schemas/class-category.schema.js';

@Injectable()
export class ChildrenService {
  constructor(
    @InjectModel(Child.name) private childModel: Model<ChildDocument>,
    @InjectModel(ClassCategory.name) private classCategoryModel: Model<ClassCategoryDocument>
  ) {}

  async getCategories(branchId: string, mentorId?: string) {
    const filter: any = { branchId };
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
      if (category.name === "0-2" && ageInYears >= 3) return true;
      if (category.name === "2-6" && ageInYears >= 7) return true;
      if (category.name === "7-9" && ageInYears >= 10) return true;
      return false;
    });
  }

  async promoteChild(childId: string, newClassCategoryId: string) {
    return this.childModel.findByIdAndUpdate(childId, { classCategoryId: newClassCategoryId }, { new: true });
  }

  async getChildrenByParent(parentId: string) {
    return this.childModel.find({ parentIds: parentId }).populate('classCategoryId');
  }

  async getChildrenByClass(classCategoryId: string) {
    return this.childModel.find({ classCategoryId }).populate('parentIds', 'name email phoneNumber whatsappNumber');
  }

  async updateMedicalInfo(childId: string, medicalInfo: any) {
    const child = await this.childModel.findByIdAndUpdate(
      childId,
      { medicalInfo },
      { new: true }
    );
    if (!child) throw new NotFoundException('Child not found');
    return child;
  }
}
