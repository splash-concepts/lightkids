import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Child, ChildDocument } from '../schemas/child.schema.js';
import { ClassCategory, ClassCategoryDocument } from '../schemas/class-category.schema.js';
import { Attendance, AttendanceDocument } from '../schemas/attendance.schema.js';
import { AcademicMaterial, AcademicMaterialDocument } from '../schemas/academic-material.schema.js';
import { User, UserDocument } from '../schemas/user.schema.js';
import { Branch, BranchDocument } from '../schemas/branch.schema.js';

@Injectable()
export class ChildrenService {
  constructor(
    @InjectModel(Child.name) private childModel: Model<ChildDocument>,
    @InjectModel(ClassCategory.name) private classCategoryModel: Model<ClassCategoryDocument>,
    @InjectModel(Attendance.name) private attendanceModel: Model<AttendanceDocument>,
    @InjectModel(AcademicMaterial.name) private materialModel: Model<AcademicMaterialDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Branch.name) private branchModel: Model<BranchDocument>
  ) {}

  async getCategories(branchId?: string, mentorId?: string) {
    const filter: any = branchId
      ? { $or: [{ branchId: new Types.ObjectId(branchId) }, { branchId: { $exists: false } }, { branchId: null }] }
      : {};
    if (mentorId) {
      filter.mentorIds = new Types.ObjectId(mentorId);
    }
    const classes = await this.classCategoryModel.find(filter).sort({ name: 1 });

    if (branchId) {
      return classes.map(cls => {
        const obj = cls.toObject();
        if (obj.branchAliases && obj.branchAliases.length > 0) {
          const alias = obj.branchAliases.find((a: any) => a.branchId?.toString() === branchId);
          if (alias && alias.name) {
            obj.name = alias.name;
          }
        }
        return obj;
      });
    }

    return classes;
  }

  async registerChild(data: any, userId: string, role: string, branchId?: string) {
    // Generate a unique 6-digit code
    const uniqueCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Ensure branchId is resolved
    let resolvedBranchId = branchId;
    if (!resolvedBranchId || resolvedBranchId === 'undefined' || resolvedBranchId === 'null') {
      if (userId && Types.ObjectId.isValid(userId)) {
        const user = await this.userModel.findById(userId);
        if (user?.branchId) resolvedBranchId = user.branchId.toString();
      }
      if (!resolvedBranchId) {
        const defaultBranch = await this.branchModel.findOne();
        if (defaultBranch) resolvedBranchId = defaultBranch._id.toString();
      }
    }

    // Collect all parent ID candidates
    const rawParentIds = [
      ...(Array.isArray(data.parentIds) ? data.parentIds : data.parentIds ? [data.parentIds] : []),
      ...(Array.isArray(data['parentIds[]']) ? data['parentIds[]'] : data['parentIds[]'] ? [data['parentIds[]']] : []),
      ...(data.parentId ? [data.parentId] : []),
      ...(role === 'PARENT' && userId ? [userId] : [])
    ];

    const normalizedParentIds: Types.ObjectId[] = [];
    for (const p of rawParentIds) {
      if (p && Types.ObjectId.isValid(p.toString())) {
        const objId = new Types.ObjectId(p.toString());
        if (!normalizedParentIds.some(id => id.toString() === objId.toString())) {
          normalizedParentIds.push(objId);
        }
      }
    }

    // Resolve Parents Info (Mother & Father Call Line and WhatsApp Line)
    let userObj: any = null;
    if (userId && Types.ObjectId.isValid(userId)) {
      userObj = await this.userModel.findById(userId);
    }

    const parentsInfo: any = data.parentsInfo || {};

    const motherName = data['parentsInfo[mother][name]'] || data.motherName || parentsInfo.mother?.name || '';
    const motherPhone = data['parentsInfo[mother][phone]'] || data.motherPhone || parentsInfo.mother?.phone || '';
    const motherWhatsapp = data['parentsInfo[mother][whatsapp]'] || data.motherWhatsapp || parentsInfo.mother?.whatsapp || '';

    const fatherName = data['parentsInfo[father][name]'] || data.fatherName || parentsInfo.father?.name || '';
    const fatherPhone = data['parentsInfo[father][phone]'] || data.fatherPhone || parentsInfo.father?.phone || '';
    const fatherWhatsapp = data['parentsInfo[father][whatsapp]'] || data.fatherWhatsapp || parentsInfo.father?.whatsapp || '';

    parentsInfo.mother = {
      name: motherName,
      phone: motherPhone,
      whatsapp: motherWhatsapp,
      ...(parentsInfo.mother?.userId && { userId: new Types.ObjectId(parentsInfo.mother.userId) })
    };

    parentsInfo.father = {
      name: fatherName,
      phone: fatherPhone,
      whatsapp: fatherWhatsapp,
      ...(parentsInfo.father?.userId && { userId: new Types.ObjectId(parentsInfo.father.userId) })
    };

    // If user is PARENT, associate them to the correct parent card
    if (role === 'PARENT' && userObj) {
      const userObjId = new Types.ObjectId(userObj._id);
      if (userObj.parentType === 'Mother') {
        parentsInfo.mother.name = parentsInfo.mother.name || userObj.name;
        parentsInfo.mother.phone = parentsInfo.mother.phone || userObj.phoneNumber;
        parentsInfo.mother.whatsapp = parentsInfo.mother.whatsapp || userObj.whatsappNumber;
        parentsInfo.mother.userId = userObjId;
      } else if (userObj.parentType === 'Father') {
        parentsInfo.father.name = parentsInfo.father.name || userObj.name;
        parentsInfo.father.phone = parentsInfo.father.phone || userObj.phoneNumber;
        parentsInfo.father.whatsapp = parentsInfo.father.whatsapp || userObj.whatsappNumber;
        parentsInfo.father.userId = userObjId;
      } else {
        // If unspecified, set name if missing
        if (!parentsInfo.mother.name && !parentsInfo.father.name) {
          parentsInfo.mother.name = userObj.name;
          parentsInfo.mother.phone = userObj.phoneNumber;
          parentsInfo.mother.whatsapp = userObj.whatsappNumber;
          parentsInfo.mother.userId = userObjId;
        }
      }
    }

    if (data.dob && !data.classCategoryId) {
      const today = new Date();
      const ageInYears = (today.getTime() - new Date(data.dob).getTime()) / (1000 * 3600 * 24 * 365.25);
      const categories = await this.classCategoryModel.find({ 
        $or: [
          ...(resolvedBranchId ? [{ branchId: new Types.ObjectId(resolvedBranchId) }] : []),
          { branchId: { $exists: false } },
          { branchId: null }
        ] 
      });
      const matchedCategory = categories.find(c => ageInYears >= (c.ageMin || 0) && ageInYears < (c.ageMax ? c.ageMax + 1 : 999));
      if (matchedCategory) {
        data.classCategoryId = matchedCategory._id;
      }
    }

    // Clean up data before creating
    delete data['parentIds[]'];
    delete data.parentId;

    const child = await this.childModel.create({
      ...data,
      parentIds: normalizedParentIds,
      parentsInfo,
      uniqueCode,
      branchId: resolvedBranchId ? new Types.ObjectId(resolvedBranchId) : undefined,
    });
    return child;
  }

  async getPromotableChildren(branchId: string) {
    const children = await this.childModel.find({ branchId }).populate('classCategoryId');
    const today = new Date();
    
    return children.filter(child => {
      const ageInYears = (today.getTime() - new Date(child.dob).getTime()) / (1000 * 3600 * 24 * 365.25);
      const category: any = child.classCategoryId;
      
      if (!category) return false;
      if (category.ageMax && ageInYears >= (category.ageMax + 1)) return true;
      return false;
    });
  }

  async promoteChild(childId: string, newClassCategoryId: string, note?: string, teacherId?: string) {
    const updatePayload: any = { classCategoryId: newClassCategoryId };
    if (note && teacherId) {
      updatePayload.$push = { teacherNotes: { note, date: new Date(), teacherId } };
    }
    return this.childModel.findByIdAndUpdate(childId, updatePayload, { new: true });
  }

  async getChildrenByParent(parentId: string) {
    const pIdObj = Types.ObjectId.isValid(parentId) ? new Types.ObjectId(parentId) : null;
    
    // Find parent user to check phone numbers as well for maximum linkage resilience
    let parentUser: any = null;
    if (pIdObj) {
      parentUser = await this.userModel.findById(pIdObj).lean();
    }

    const orClauses: any[] = [
      ...(pIdObj ? [{ parentIds: pIdObj }] : []),
      { parentIds: parentId },
      ...(pIdObj ? [{ 'parentsInfo.father.userId': pIdObj }] : []),
      { 'parentsInfo.father.userId': parentId },
      ...(pIdObj ? [{ 'parentsInfo.mother.userId': pIdObj }] : []),
      { 'parentsInfo.mother.userId': parentId },
    ];

    if (parentUser?.phoneNumber) {
      orClauses.push({ 'parentsInfo.father.phone': parentUser.phoneNumber });
      orClauses.push({ 'parentsInfo.mother.phone': parentUser.phoneNumber });
    }
    if (parentUser?.whatsappNumber) {
      orClauses.push({ 'parentsInfo.father.whatsapp': parentUser.whatsappNumber });
      orClauses.push({ 'parentsInfo.mother.whatsapp': parentUser.whatsappNumber });
    }

    const kids = await this.childModel.find({ $or: orClauses })
      .populate('classCategoryId')
      .populate('parentIds', 'name email phoneNumber whatsappNumber parentType')
      .lean();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    for (const kid of kids) {
      const attendance = await this.attendanceModel.findOne({
        childId: kid._id,
        date: { $gte: today, $lte: endOfDay }
      }).sort({ date: -1 });
      if (attendance) {
        (kid as any).todayAttendanceStatus = attendance.status;
      }
    }
    return kids;
  }

  async getChildrenByClass(classCategoryId: string) {
    return this.childModel.find({ classCategoryId }).populate('parentIds', 'name email phoneNumber whatsappNumber parentType');
  }

  async getChildProfile(childId: string, userId: string, role: string) {
    const child = await this.childModel.findById(childId)
      .populate({
        path: 'classCategoryId',
        populate: { path: 'mentorIds', select: 'name email profileImage' }
      })
      .populate('parentIds', 'name email phoneNumber whatsappNumber parentType');
    if (!child) throw new NotFoundException('Child not found');
    
    if (role === 'PARENT') {
      const isLinked = 
        child.parentIds.some((p: any) => p._id.toString() === userId) ||
        child.parentsInfo?.father?.userId?.toString() === userId ||
        child.parentsInfo?.mother?.userId?.toString() === userId;
      if (!isLinked) {
        throw new UnauthorizedException('Not authorized to view this child');
      }
    }

    const attendance = await this.attendanceModel.find({ childId }).sort({ date: -1 });
    let materials: any[] = [];
    if (child.classCategoryId) {
      materials = await this.materialModel.find({ classCategoryId: child.classCategoryId._id }).sort({ createdAt: -1 });
    }
    let classes = await this.classCategoryModel.find({ 
      $or: [
        ...(child.branchId ? [{ branchId: child.branchId }] : []),
        { branchId: { $exists: false } },
        { branchId: null }
      ] 
    });
    
    // Apply aliases
    if (child.branchId) {
      classes = classes.map(cls => {
        const obj = cls.toObject();
        if (obj.branchAliases && obj.branchAliases.length > 0) {
          const alias = obj.branchAliases.find((a: any) => a.branchId?.toString() === child.branchId.toString());
          if (alias && alias.name) {
            obj.name = alias.name;
          }
        }
        return obj as any;
      });
    }

    return { child, attendance, materials, classes };
  }

  async updateChild(childId: string, data: any, userId: string, role: string) {
    const child = await this.childModel.findById(childId);
    if (!child) throw new NotFoundException('Child not found');

    if (role === 'PARENT') {
      const isLinked = 
        child.parentIds.some((p: any) => p._id.toString() === userId) ||
        child.parentsInfo?.father?.userId?.toString() === userId ||
        child.parentsInfo?.mother?.userId?.toString() === userId;
      if (!isLinked) {
        throw new UnauthorizedException('Not authorized to update this child');
      }
    }

    // Auto-assign class if dob is provided and class is unassigned or provided
    if (data.dob && !data.classCategoryId) {
      const today = new Date();
      const ageInYears = (today.getTime() - new Date(data.dob).getTime()) / (1000 * 3600 * 24 * 365.25);
      const categories = await this.classCategoryModel.find({ 
        $or: [
          ...(child.branchId ? [{ branchId: child.branchId }] : []),
          { branchId: { $exists: false } },
          { branchId: null }
        ] 
      });
      const matchedCategory = categories.find(c => ageInYears >= (c.ageMin || 0) && ageInYears < (c.ageMax ? c.ageMax + 1 : 999));
      if (matchedCategory) {
        data.classCategoryId = matchedCategory._id;
      }
    }

    return this.childModel.findByIdAndUpdate(childId, { $set: data }, { new: true })
      .populate('classCategoryId')
      .populate('parentIds', 'name email phoneNumber whatsappNumber parentType');
  }
}
