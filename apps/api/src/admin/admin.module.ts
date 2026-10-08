import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminController } from './admin.controller.js';
import { AdminService } from './admin.service.js';
import { User, UserSchema } from '../schemas/user.schema.js';
import { Child, ChildSchema } from '../schemas/child.schema.js';
import { Attendance, AttendanceSchema } from '../schemas/attendance.schema.js';
import { AcademicMaterial, AcademicMaterialSchema } from '../schemas/academic-material.schema.js';
import { Branch, BranchSchema } from '../schemas/branch.schema.js';
import { ClassCategory, ClassCategorySchema } from '../schemas/class-category.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Child.name, schema: ChildSchema },
      { name: Attendance.name, schema: AttendanceSchema },
      { name: AcademicMaterial.name, schema: AcademicMaterialSchema },
      { name: Branch.name, schema: BranchSchema },
      { name: ClassCategory.name, schema: ClassCategorySchema }
    ])
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
