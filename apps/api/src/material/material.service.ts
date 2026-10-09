import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AcademicMaterial, AcademicMaterialDocument, MaterialType } from '../schemas/academic-material.schema.js';
import { Child, ChildDocument } from '../schemas/child.schema.js';
import { ClassCategory, ClassCategoryDocument } from '../schemas/class-category.schema.js';

@Injectable()
export class MaterialService {
  constructor(
    @InjectModel(AcademicMaterial.name) private materialModel: Model<AcademicMaterialDocument>,
    @InjectModel(Child.name) private childModel: Model<ChildDocument>,
    @InjectModel(ClassCategory.name) private classCategoryModel: Model<ClassCategoryDocument>
  ) {}

  async uploadMaterial(data: { classCategoryId: string; type: MaterialType; title: string; content?: string; fileUrl?: string; authorId: string; branchId: string }) {
    return this.materialModel.create(data);
  }

  async getMaterialsByClass(classCategoryId: string, branchId: string, type?: MaterialType, page: number = 1, limit: number = 20) {
    const filter: any = { classCategoryId, branchId };
    if (type) filter.type = type;
    
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.materialModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('authorId', 'name').populate('classCategoryId', 'name'),
      this.materialModel.countDocuments(filter)
    ]);
    return { data, total, page, totalPages: Math.ceil(total / limit) };
  }

  async getAllMaterials(user: any, type?: MaterialType, page: number = 1, limit: number = 20) {
    const filter: any = {};
    if (type) filter.type = type;

    if (user.role === 'SUPER_ADMIN') {
      // Global access, no filter
    } else if (user.role === 'ADMIN' || user.role === 'MINISTER') {
      filter.branchId = user.branchId;
    } else if (user.role === 'MENTOR') {
      // Find classes assigned to this mentor
      const classes = await this.classCategoryModel.find({ mentorIds: user.userId });
      filter.classCategoryId = { $in: classes.map(c => c._id) };
    } else if (user.role === 'PARENT') {
      // Find children for this parent
      const children = await this.childModel.find({ parentIds: user.userId });
      filter.classCategoryId = { $in: children.map(c => c.classCategoryId).filter(id => !!id) };
    }

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.materialModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('authorId', 'name').populate('classCategoryId', 'name'),
      this.materialModel.countDocuments(filter)
    ]);
    return { data, total, page, totalPages: Math.ceil(total / limit) };
  }
}
