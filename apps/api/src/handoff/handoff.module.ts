import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HandoffService } from './handoff.service.js';
import { HandoffController } from './handoff.controller.js';
import { HandoffLog, HandoffLogSchema } from '../schemas/handoff-log.schema.js';
import { Child, ChildSchema } from '../schemas/child.schema.js';
import { NotificationsModule } from '../notifications/notifications.module.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: HandoffLog.name, schema: HandoffLogSchema },
      { name: Child.name, schema: ChildSchema },
    ]),
    NotificationsModule,
  ],
  controllers: [HandoffController],
  providers: [HandoffService],
})
export class HandoffModule {}
