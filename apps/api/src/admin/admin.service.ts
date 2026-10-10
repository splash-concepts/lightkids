import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument, UserRole } from '../schemas/user.schema.js';
import { Child, ChildDocument } from '../schemas/child.schema.js';
import { Attendance, AttendanceDocument, AttendanceStatus } from '../schemas/attendance.schema.js';
import { AcademicMaterial, AcademicMaterialDocument } from '../schemas/academic-material.schema.js';
import { Branch, BranchDocument } from '../schemas/branch.schema.js';
import { ClassCategory, ClassCategoryDocument } from '../schemas/class-category.schema.js';
import { Archive, ArchiveDocument } from '../schemas/archive.schema.js';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Child.name) private childModel: Model<ChildDocument>,
    @InjectModel(Attendance.name) private attendanceModel: Model<AttendanceDocument>,
    @InjectModel(AcademicMaterial.name) private materialModel: Model<AcademicMaterialDocument>,
    @InjectModel(Branch.name) private branchModel: Model<BranchDocument>,
    @InjectModel(ClassCategory.name) private classCategoryModel: Model<ClassCategoryDocument>,
    @InjectModel(Archive.name) private archiveModel: Model<ArchiveDocument>
  ) {}

  async getStats(branchId?: string) {
    const filter = branchId ? { branchId } : {};
    const userFilter = branchId ? { branchId, role: UserRole.PARENT } : { role: UserRole.PARENT };
    const mentorFilter = branchId ? { branchId, role: UserRole.MENTOR } : { role: UserRole.MENTOR };

    const totalParents = await this.userModel.countDocuments(userFilter);
    const totalMentors = await this.userModel.countDocuments(mentorFilter);
    const totalChildren = await this.childModel.countDocuments(filter);
    
    // Calculate attendance for today
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const presentOrPickedUp = [AttendanceStatus.PRESENT, AttendanceStatus.PICKED_UP];

    // Chart Data (All Time Trend)
    const attendanceTrend = await this.attendanceModel.aggregate([
      { $match: branchId ? { branchId } : {} },
      { $group: {
        _id: { $dateToString: { format: "%Y-%m", date: "$date" } },
        Presents: { $sum: { $cond: [{ $in: ["$status", presentOrPickedUp] }, 1, 0] } }
      }},
      { $sort: { _id: 1 } }
    ]);
    
    const chartData = attendanceTrend.length > 0 ? attendanceTrend.map(t => ({ name: t._id, Presents: t.Presents })) : [{ name: 'No Data', Presents: 0 }];

    // Today's Detailed Stats
    const allMentors = await this.userModel.find({ role: UserRole.MENTOR, ...(branchId && { branchId }) });
    const mentorAttendanceToday = await this.attendanceModel.find({
      date: { $gte: startOfDay, $lte: endOfDay },
      userId: { $exists: true },
      ...(branchId && { branchId })
    });
    
    // Mentor stats
    const presentMentorIds = mentorAttendanceToday.filter(a => presentOrPickedUp.includes(a.status)).map(a => a.userId?.toString());
    const absentMentors = allMentors.filter(m => !presentMentorIds.includes(m._id.toString()));

    // Kids stats
    const allKids = await this.childModel.find(branchId ? { branchId } : {}).populate('parentIds', 'name email phoneNumber whatsappNumber').populate('classCategoryId');
    const kidAttendanceToday = await this.attendanceModel.find({
      date: { $gte: startOfDay, $lte: endOfDay },
      childId: { $exists: true },
      ...(branchId && { branchId })
    }).populate({
      path: 'childId',
      populate: [
        { path: 'parentIds', select: 'name email phoneNumber whatsappNumber' },
        { path: 'classCategoryId' }
      ]
    });
    
    const presentKidIds = kidAttendanceToday.filter(a => presentOrPickedUp.includes(a.status)).map(a => a.childId?._id?.toString() || a.childId?.toString());
    const absentKids = allKids.filter(k => !presentKidIds.includes(k._id.toString()));

    const presentKidsData = kidAttendanceToday.filter(a => a.status === AttendanceStatus.PRESENT).map(a => a.childId);
    const pickedUpKidsData = kidAttendanceToday.filter(a => a.status === AttendanceStatus.PICKED_UP).map(a => a.childId);
    const totalPresentAndPickedUp = presentKidsData.length + pickedUpKidsData.length;

    // Past 7 Days Absents
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    oneWeekAgo.setHours(0, 0, 0, 0);
    const pastWeekAbsents = await this.attendanceModel.find({
      date: { $gte: oneWeekAgo, $lt: startOfDay },
      status: AttendanceStatus.ABSENT,
      childId: { $exists: true },
      ...(branchId && { branchId })
    }).populate({
      path: 'childId',
      populate: [
        { path: 'parentIds', select: 'name phoneNumber whatsappNumber' },
        { path: 'classCategoryId', select: 'name' }
      ]
    }).sort({ date: -1 });

    const now = new Date();
    const promotableKids = allKids.filter(child => {
      if (!child.dob || !child.classCategoryId) return false;
      const ageInYears = (now.getTime() - new Date(child.dob).getTime()) / (1000 * 3600 * 24 * 365.25);
      const category: any = child.classCategoryId;
      return category.ageMax && ageInYears >= (category.ageMax + 1);
    });

    return { 
      totalParents, totalMentors, totalChildren, 
      presentToday: totalPresentAndPickedUp, 
      chartData,
      today: {
        absentMentors,
        absentKids,
        presentKids: presentKidsData,
        pickedUpKids: pickedUpKidsData,
        promotableKids,
      },
      pastWeekAbsents,
    };
  }

  async getUsers(role?: string, branchId?: string, page: number = 1, limit: number = 50, isApproved?: boolean) {
    const filter: any = {};
    if (role) filter.role = role;
    if (branchId) filter.branchId = branchId;
    if (isApproved !== undefined) filter.isApproved = isApproved;
    
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.userModel.find(filter).select('-password').sort({ createdAt: -1 }).skip(skip).limit(limit),
      this.userModel.countDocuments(filter)
    ]);
    
    return { data, total, page, totalPages: Math.ceil(total / limit) };
  }

  async getUserProfile(id: string) {
    const user = await this.userModel.findById(id).select('-password');
    if (!user) return null;
    
    let children: any[] = [];
    let classes: any[] = [];
    
    if (user.role === UserRole.PARENT) {
      children = await this.childModel.find({ parentIds: user._id }).populate('classCategoryId');
      if (user.branchId) {
        children = children.map((child: any) => {
          const obj = child.toObject();
          const classCategory = obj.classCategoryId as any;
          if (classCategory && classCategory.branchAliases) {
            const alias = classCategory.branchAliases.find((a: any) => a.branchId?.toString() === user.branchId?.toString());
            if (alias && alias.name) {
              classCategory.name = alias.name;
            }
          }
          return obj as any;
        });
      }
    } else if (user.role === UserRole.MENTOR) {
      classes = await this.classCategoryModel.find({ mentorIds: user._id });
      if (user.branchId) {
        classes = classes.map(cls => {
          const obj = cls.toObject();
          if (obj.branchAliases && obj.branchAliases.length > 0) {
            const alias = obj.branchAliases.find((a: any) => a.branchId?.toString() === user.branchId?.toString());
            if (alias && alias.name) {
              obj.name = alias.name;
            }
          }
          return obj as any;
        });
      }
    }
    
    return { user, children, classes };
  }

  async getChildren(branchId?: string, page: number = 1, limit: number = 50) {
    const filter = branchId ? { branchId } : {};
    
    const skip = (page - 1) * limit;
    let [data, total] = await Promise.all([
      this.childModel.find(filter).populate('classCategoryId').populate('parentIds', 'name email phoneNumber whatsappNumber').sort({ createdAt: -1 }).skip(skip).limit(limit),
      this.childModel.countDocuments(filter)
    ]);
    
    if (branchId) {
      data = data.map((child: any) => {
        const obj = child.toObject();
        if (obj.classCategoryId && obj.classCategoryId.branchAliases) {
          const alias = obj.classCategoryId.branchAliases.find((a: any) => a.branchId?.toString() === branchId);
          if (alias && alias.name) {
            obj.classCategoryId.name = alias.name;
          }
        }
        return obj as any;
      });
    }

    return { data, total, page, totalPages: Math.ceil(total / limit) };
  }

  async getChild(id: string) {
    const child = await this.childModel.findById(id).populate('classCategoryId').populate('parentIds', 'name email phoneNumber whatsappNumber');
    const attendance = await this.attendanceModel.find({ childId: id }).sort({ date: -1 });

    let childObj: any = child ? child.toObject() : null;
    if (childObj && childObj.classCategoryId && childObj.classCategoryId.branchAliases && childObj.branchId) {
      const alias = childObj.classCategoryId.branchAliases.find((a: any) => a.branchId?.toString() === childObj.branchId.toString());
      if (alias && alias.name) {
        childObj.classCategoryId.name = alias.name;
      }
    }

    return { child: childObj, attendance };
  }

  async deleteChild(id: string, actorId: string) {
    const child = await this.childModel.findById(id);
    if (!child) throw new NotFoundException('Child not found');
    
    // Archive
    await this.archiveModel.create({
      entityType: 'Child',
      originalId: child._id.toString(),
      data: child.toObject(),
      archivedBy: actorId
    });

    await this.childModel.findByIdAndDelete(id);
    return { success: true };
  }

  async getAttendanceHistory(branchId?: string, page: number = 1, limit: number = 100) {
    const filter = branchId ? { branchId } : {};
    
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.attendanceModel.find(filter).populate('childId').populate('markedBy').sort({ date: -1 }).skip(skip).limit(limit),
      this.attendanceModel.countDocuments(filter)
    ]);
    
    return { data, total, page, totalPages: Math.ceil(total / limit) };
  }

  // Multi-Tenancy / Branch Management
  async createBranch(data: { name: string; location?: string; contactEmail?: string }) {
    const branch = await this.branchModel.create(data);
    
    // Seed default class categories for the new branch
    const defaultClasses = [
      { name: 'Wisdom class', description: 'Ages 1-3', branchId: branch._id, ageMin: 1, ageMax: 3 },
      { name: 'Victory class', description: 'Ages 4-6', branchId: branch._id, ageMin: 4, ageMax: 6 },
      { name: 'Faith class', description: 'Ages 7-9', branchId: branch._id, ageMin: 7, ageMax: 9 },
      { name: 'Light class', description: 'Ages 10-12', branchId: branch._id, ageMin: 10, ageMax: 12 },
    ];
    await this.classCategoryModel.insertMany(defaultClasses);
    
    return branch;
  }

  async getBranches() {
    return this.branchModel.find().sort({ createdAt: -1 });
  }

  async deleteBranch(id: string, actorId: string) {
    const branch = await this.branchModel.findById(id);
    if (!branch) return { success: false };

    // Archive
    await this.archiveModel.create({
      entityType: 'Branch',
      originalId: branch._id.toString(),
      data: branch.toObject(),
      archivedBy: actorId
    });

    await this.branchModel.findByIdAndDelete(id);
    return { success: true };
  }

  // Class Management per Branch
  async createClassCategory(data: { name: string; description?: string; branchId: string; ageMin?: number; ageMax?: number }) {
    return this.classCategoryModel.create(data);
  }

  async getClassCategories(branchId?: string) {
    const filter = branchId ? { $or: [{ branchId: new Types.ObjectId(branchId) }, { branchId: { $exists: false } }, { branchId: null }] } : {};
    const classes = await this.classCategoryModel.find(filter).populate({
      path: 'mentorIds',
      select: 'name email role branchId',
      match: branchId ? { branchId: new Types.ObjectId(branchId) } : {}
    }).sort({ name: 1 });

    if (branchId) {
      return classes.map(cls => {
        const obj = cls.toObject();
        if (obj.branchAliases && obj.branchAliases.length > 0) {
          const alias = obj.branchAliases.find((a: any) => a.branchId?.toString() === branchId);
          if (alias && alias.name) {
            obj.name = alias.name;
          }
        }
        // Filter out nulls from mentorIds array (due to populate match filtering out other branch mentors)
        if (obj.mentorIds) {
          obj.mentorIds = obj.mentorIds.filter((m: any) => m != null);
        }
        return obj;
      });
    }

    return classes;
  }

  async updateClassCategory(id: string, data: { name?: string; description?: string; mentorIds?: string[]; ageMin?: number; ageMax?: number }, branchId?: string) {
    const category = await this.classCategoryModel.findById(id);
    if (!category) return null;

    if (branchId && (!category.branchId || category.branchId.toString() !== branchId)) {
      // Admin modifying a Global Class -> Setup an Alias
      if (data.name) {
        let aliases: any[] = category.branchAliases || [];
        const existingIdx = aliases.findIndex((a: any) => a.branchId?.toString() === branchId);
        if (existingIdx >= 0) {
          aliases[existingIdx].name = data.name;
        } else {
          aliases.push({ branchId: new Types.ObjectId(branchId), name: data.name });
        }
        
        return this.classCategoryModel.findByIdAndUpdate(
          id,
          { $set: { branchAliases: aliases } },
          { new: true }
        );
      }
      return category; // If not changing name, nothing else an admin can change on a global class
    }

    // Normal update (Super Admin, or branch Admin updating their own local class)
    return this.classCategoryModel.findOneAndUpdate(
      { _id: id },
      { $set: data },
      { new: true }
    );
  }

  async deleteClassCategory(id: string, branchId: string, isSuperAdmin: boolean, actorId: string) {
    const filter: any = { _id: id };
    if (!isSuperAdmin) filter.branchId = branchId;
    
    const category = await this.classCategoryModel.findOne(filter);
    if (!category) return { success: false };

    // Archive
    await this.archiveModel.create({
      entityType: 'ClassCategory',
      originalId: category._id.toString(),
      data: category.toObject(),
      archivedBy: actorId
    });

    const deleted = await this.classCategoryModel.findOneAndDelete(filter);
    if (deleted) {
      // Unassign children from this class
      await this.childModel.updateMany({ classCategoryId: id }, { $unset: { classCategoryId: "" } });
    }
    return { success: !!deleted };
  }

  // User Management
  async transferUserBranch(userId: string, newBranchId: string) {
    const user = await this.userModel.findByIdAndUpdate(userId, { branchId: newBranchId }, { new: true });
    
    if (user && user.role === UserRole.PARENT) {
      // Transfer all children of this parent to the new branch
      await this.childModel.updateMany(
        { parentIds: userId },
        { $set: { branchId: newBranchId } }
      );
    }
    
    return user;
  }

  async updateUserRole(userId: string, updateData: { role?: string; office?: string }, actorRole: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    if (actorRole === 'ADMIN') {
      if (user.role === 'SUPER_ADMIN' || user.role === 'MINISTER') {
        throw new UnauthorizedException('Admin cannot modify SUPER_ADMIN or MINISTER accounts');
      }
      if (updateData.role === 'SUPER_ADMIN' || updateData.role === 'MINISTER') {
        throw new UnauthorizedException('Admin cannot assign SUPER_ADMIN or MINISTER roles');
      }
    }

    if (updateData.role) user.role = updateData.role as UserRole;
    if (updateData.office !== undefined) user.office = updateData.office;

    return user.save();
  }

  async approveUser(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    user.isApproved = true;
    return user.save();
  }

  async deleteUser(userId: string, actorId: string, actorRole: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    if (actorRole === 'ADMIN' && (user.role === 'SUPER_ADMIN' || user.role === 'MINISTER')) {
      throw new UnauthorizedException('Admin cannot delete SUPER_ADMIN or MINISTER accounts');
    }

    if (userId === actorId) {
      throw new UnauthorizedException('You cannot delete your own account');
    }

    // Archive
    await this.archiveModel.create({
      entityType: 'User',
      originalId: user._id.toString(),
      data: user.toObject(),
      archivedBy: actorId
    });

    await this.userModel.findByIdAndDelete(userId);
    return { success: true };
  }

  async assignClassesToMentor(userId: string, classIds: string[], branchId: string, isSuperAdmin: boolean) {
    const branchFilter = isSuperAdmin ? {} : { 
      $or: [{ branchId: new Types.ObjectId(branchId) }, { branchId: { $exists: false } }, { branchId: null }] 
    };
    
    // First, remove mentor from all classes in the applicable scope
    await this.classCategoryModel.updateMany(
      { ...branchFilter, mentorIds: userId },
      { $pull: { mentorIds: userId } }
    );
    
    // Then, add mentor to the specified classes
    if (classIds && classIds.length > 0) {
      await this.classCategoryModel.updateMany(
        { _id: { $in: classIds }, ...branchFilter },
        { $addToSet: { mentorIds: userId } }
      );
    }
    
    return { success: true };
  }
}
