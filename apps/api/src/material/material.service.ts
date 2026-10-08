import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AcademicMaterial, AcademicMaterialDocument, MaterialType } from '../schemas/academic-material.schema.js';

@Injectable()
export class MaterialService {
  constructor(@InjectModel(AcademicMaterial.name) private materialModel: Model<AcademicMaterialDocument>) {}

  async uploadMaterial(data: { classCategoryId: string; type: MaterialType; title: string; content?: string; fileUrl?: string; authorId: string; branchId: string }) {
    return this.materialModel.create(data);
  }

  async getMaterialsByClass(classCategoryId: string, branchId: string, type?: MaterialType) {
    const filter: any = { classCategoryId, branchId };
    if (type) filter.type = type;
    
    return this.materialModel.find(filter).sort({ createdAt: -1 }).populate('authorId', 'name');
  }
}
