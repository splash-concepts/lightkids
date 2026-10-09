import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { HandoffLog, HandoffLogDocument, HandoffType } from '../schemas/handoff-log.schema.js';
import { Child, ChildDocument } from '../schemas/child.schema.js';
import { NotificationsGateway } from '../notifications/notifications.gateway.js';
import { AttendanceService } from '../attendance/attendance.service.js';
import { AttendanceStatus } from '../schemas/attendance.schema.js';

@Injectable()
export class HandoffService {
  constructor(
    @InjectModel(HandoffLog.name) private handoffModel: Model<HandoffLogDocument>,
    @InjectModel(Child.name) private childModel: Model<ChildDocument>,
    private notificationsGateway: NotificationsGateway,
    private attendanceService: AttendanceService,
  ) {}

  async verifyCode(code: string) {
    const child = await this.childModel.findOne({ uniqueCode: code });
    if (!child) throw new NotFoundException('Invalid verification code');
    
    if (!child.parentIds || child.parentIds.length === 0) {
      return this.childModel.find({ _id: child._id }).populate('classCategoryId');
    }
    
    // Find all children that share any parent with this child (siblings)
    return this.childModel.find({ parentIds: { $in: child.parentIds } }).populate('classCategoryId');
  }

  async logHandoff(childId: string, type: HandoffType, code: string, loggedById: string) {
    const child = await this.childModel.findById(childId);
    if (!child) throw new NotFoundException('Child not found');
    
    // Check if the code belongs to this child OR any sibling
    let isValidCode = child.uniqueCode === code;
    
    if (!isValidCode && child.parentIds && child.parentIds.length > 0) {
      const siblingWithCode = await this.childModel.findOne({ 
        parentIds: { $in: child.parentIds },
        uniqueCode: code
      });
      if (siblingWithCode) isValidCode = true;
    }

    if (!isValidCode) {
      throw new BadRequestException('Invalid unique code for handoff');
    }

    const log = await this.handoffModel.create({
      childId,
      type,
      time: new Date(),
      verifiedByCode: code,
      loggedBy: loggedById,
      branchId: child.branchId,
    });

    // Log attendance
    await this.attendanceService.markAttendance({
      childId,
      status: type === HandoffType.DROP_OFF ? AttendanceStatus.PRESENT : AttendanceStatus.PICKED_UP,
      reason: `Handoff: ${type}`,
      loggedBy: loggedById,
      branchId: child.branchId.toString(),
    });

    // Notify all parents of the child
    child.parentIds.forEach((parentId: any) => {
      this.notificationsGateway.notifyParent(parentId.toString(), 'handoff', {
        childName: child.name,
        type: type,
        time: log.time,
      });
    });

    return log;
  }

  async getRecentLogs(limit: number = 20) {
    return this.handoffModel.find()
      .sort({ time: -1 })
      .limit(limit)
      .populate('childId', 'name classCategoryId')
      .populate('loggedBy', 'name role');
  }
}
