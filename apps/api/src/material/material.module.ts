import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MaterialService } from './material.service.js';
import { MaterialController } from './material.controller.js';
import { AcademicMaterial, AcademicMaterialSchema } from '../schemas/academic-material.schema.js';
import { Child, ChildSchema } from '../schemas/child.schema.js';
import { ClassCategory, ClassCategorySchema } from '../schemas/class-category.schema.js';

@Module({
  imports: [MongooseModule.forFeature([
    { name: AcademicMaterial.name, schema: AcademicMaterialSchema },
    { name: Child.name, schema: ChildSchema },
    { name: ClassCategory.name, schema: ClassCategorySchema }
  ])],
  controllers: [MaterialController],
  providers: [MaterialService],
})
export class MaterialModule {}
