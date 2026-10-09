import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AttendanceService } from './attendance.service.js';
import { AttendanceController } from './attendance.controller.js';
import { Attendance, AttendanceSchema } from '../schemas/attendance.schema.js';
import { Child, ChildSchema } from '../schemas/child.schema.js';

@Module({
  imports: [MongooseModule.forFeature([
    { name: Attendance.name, schema: AttendanceSchema },
    { name: Child.name, schema: ChildSchema }
  ])],
  controllers: [AttendanceController],
  providers: [AttendanceService],
  exports: [AttendanceService],
})
export class AttendanceModule {}
