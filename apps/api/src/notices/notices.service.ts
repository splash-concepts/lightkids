import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Notice, NoticeDocument, NoticeType } from '../schemas/notice.schema.js';

@Injectable()
export class NoticesService {
  constructor(@InjectModel(Notice.name) private noticeModel: Model<NoticeDocument>) {}

  async createEvent(data: any, authorId: string, branchId: string) {
    return this.noticeModel.create({
      ...data,
      type: NoticeType.EVENT,
      authorId,
      target: 'ALL',
      branchId,
    });
  }

  async createParentUpdate(data: any, authorId: string, branchId: string) {
    return this.noticeModel.create({
      ...data,
      type: NoticeType.PARENT_UPDATE,
      authorId,
      target: 'ADMIN', // only admin sees this
      branchId,
    });
  }

  async getNoticesForUser(userId: string, role: string, branchId: string) {
    if (role === 'ADMIN') {
      // Admins see everything
      return this.noticeModel.find({ branchId }).sort({ createdAt: -1 }).populate('authorId', 'name role');
    } else {
      // Parents/Mentors see ALL targeted (events) AND their own updates
      return this.noticeModel.find({
        branchId,
        $or: [
          { target: 'ALL' },
          { authorId: userId }
        ]
      }).sort({ createdAt: -1 }).populate('authorId', 'name role');
    }
  }
}
