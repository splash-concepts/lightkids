import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ServiceLink, ServiceLinkDocument } from '../schemas/service-link.schema.js';

@Injectable()
export class ServiceLinksService {
  constructor(@InjectModel(ServiceLink.name) private linkModel: Model<ServiceLinkDocument>) {}

  async createLink(data: { title: string; url: string; branchId?: string }, userRole: string) {
    if (userRole === 'SUPER_ADMIN') {
      delete data.branchId; // Global
    }
    return this.linkModel.create(data);
  }

  async getLinks(user: any) {
    const filter: any = {};
    if (user.role !== 'SUPER_ADMIN' && user.branchId) {
      filter.$or = [{ branchId: user.branchId }, { branchId: null }];
    }
    return this.linkModel.find(filter).sort({ createdAt: -1 }).populate('viewedBy', 'name role');
  }

  async markAsViewed(linkId: string, userId: string) {
    return this.linkModel.findByIdAndUpdate(linkId, { $addToSet: { viewedBy: new Types.ObjectId(userId) } }, { new: true });
  }
}
