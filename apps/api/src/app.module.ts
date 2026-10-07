import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

import { User, UserSchema } from './schemas/user.schema.js';
import { Child, ChildSchema } from './schemas/child.schema.js';
import { ClassCategory, ClassCategorySchema } from './schemas/class-category.schema.js';
import { Attendance, AttendanceSchema } from './schemas/attendance.schema.js';
import { HandoffLog, HandoffLogSchema } from './schemas/handoff-log.schema.js';
import { AcademicMaterial, AcademicMaterialSchema } from './schemas/academic-material.schema.js';

import { AuthModule } from './auth/auth.module.js';
import { ChildrenModule } from './children/children.module.js';
import { HandoffModule } from './handoff/handoff.module.js';
import { AttendanceModule } from './attendance/attendance.module.js';
import { MaterialModule } from './material/material.module.js';
import { NotificationsModule } from './notifications/notifications.module.js';
import { NoticesModule } from './notices/notices.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI') || 'mongodb://localhost:27017/light-kids',
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Child.name, schema: ChildSchema },
      { name: ClassCategory.name, schema: ClassCategorySchema },
      { name: Attendance.name, schema: AttendanceSchema },
      { name: HandoffLog.name, schema: HandoffLogSchema },
      { name: AcademicMaterial.name, schema: AcademicMaterialSchema },
    ]),
    AuthModule,
    ChildrenModule,
    HandoffModule,
    AttendanceModule,
    MaterialModule,
    NotificationsModule,
    NoticesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
