import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HandoffService } from './handoff.service.js';
import { HandoffController } from './handoff.controller.js';
import { HandoffLog, HandoffLogSchema } from '../schemas/handoff-log.schema.js';
import { Child, ChildSchema } from '../schemas/child.schema.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { AttendanceModule } from '../attendance/attendance.module.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: HandoffLog.name, schema: HandoffLogSchema },
      { name: Child.name, schema: ChildSchema },
    ]),
    NotificationsModule,
    AttendanceModule,
  ],
  controllers: [HandoffController],
  providers: [HandoffService],
})
export class HandoffModule {}
