import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NoticesService } from './notices.service.js';
import { NoticesController } from './notices.controller.js';
import { Notice, NoticeSchema } from '../schemas/notice.schema.js';

@Module({
  imports: [MongooseModule.forFeature([{ name: Notice.name, schema: NoticeSchema }])],
  controllers: [NoticesController],
  providers: [NoticesService],
})
export class NoticesModule {}
