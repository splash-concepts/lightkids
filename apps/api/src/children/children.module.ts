import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChildrenService } from './children.service.js';
import { ChildrenController } from './children.controller.js';
import { Child, ChildSchema } from '../schemas/child.schema.js';
import { ClassCategory, ClassCategorySchema } from '../schemas/class-category.schema.js';
import { Attendance, AttendanceSchema } from '../schemas/attendance.schema.js';
import { AcademicMaterial, AcademicMaterialSchema } from '../schemas/academic-material.schema.js';
import { User, UserSchema } from '../schemas/user.schema.js';
import { Branch, BranchSchema } from '../schemas/branch.schema.js';

@Module({
  imports: [MongooseModule.forFeature([
    { name: Child.name, schema: ChildSchema },
    { name: ClassCategory.name, schema: ClassCategorySchema },
    { name: Attendance.name, schema: AttendanceSchema },
    { name: AcademicMaterial.name, schema: AcademicMaterialSchema },
    { name: User.name, schema: UserSchema },
    { name: Branch.name, schema: BranchSchema }
  ])],
  controllers: [ChildrenController],
  providers: [ChildrenService],
})
export class ChildrenModule {}
