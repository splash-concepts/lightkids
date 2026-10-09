import { Controller, Post, Body, Get, Param, Patch, UseGuards, Req, UseInterceptors, UploadedFiles, UnauthorizedException } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { ChildrenService } from './children.service.js';
import { getCloudinaryStorage } from '../utils/cloudinary.util.js';

@Controller('children')
@UseGuards(AuthGuard('jwt'))
export class ChildrenController {
  constructor(private readonly childrenService: ChildrenService) {}

  @Post()
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'childImage', maxCount: 1 },
    { name: 'caregiverImages', maxCount: 5 }
  ], {
    storage: getCloudinaryStorage('caregivers')
  }))
  async register(@Body() body: any, @Req() req: any, @UploadedFiles() files: { childImage?: Express.Multer.File[], caregiverImages?: Express.Multer.File[] }) {
    const childImage = files?.childImage?.[0]?.path || files?.childImage?.[0]?.filename ? `/uploads/caregivers/${files.childImage[0].filename}` : null;
    const caregiverImages = files?.caregiverImages?.map(f => f.path || `/uploads/caregivers/${f.filename}`) || [];
    
    // Support Cloudinary URLs natively if path is a URL (Cloudinary storage populates .path with URL)
    const profileImage = files?.childImage?.[0]?.path?.startsWith('http') ? files.childImage[0].path : childImage;
    const resolvedCaregiverImages = files?.caregiverImages?.map(f => f.path?.startsWith('http') ? f.path : `/uploads/caregivers/${f.filename}`) || caregiverImages;

    return this.childrenService.registerChild({ ...body, profileImage, caregiverImages: resolvedCaregiverImages }, req.user.userId, req.user.role, req.user.branchId);
  }

  @Get('categories')
  async getCategories(@Req() req: any) {
    const isMentor = req.user.role === 'MENTOR';
    return this.childrenService.getCategories(req.user.branchId, isMentor ? req.user.userId : undefined);
  }

  @Get('promotable')
  async getPromotableChildren(@Req() req: any) {
    if (req.user.role !== 'ADMIN') {
      throw new UnauthorizedException('Only Admins can review promotions');
    }
    return this.childrenService.getPromotableChildren(req.user.branchId);
  }

  @Patch(':id/promote')
  async promoteChild(@Param('id') id: string, @Body('newClassCategoryId') newClassCategoryId: string, @Req() req: any) {
    if (req.user.role !== 'ADMIN') {
      throw new UnauthorizedException('Only Admins can approve promotions');
    }
    return this.childrenService.promoteChild(id, newClassCategoryId);
  }

  @Get('my-kids')
  async getMyKids(@Req() req: any) {
    return this.childrenService.getChildrenByParent(req.user.userId);
  }

  @Get('class/:classId')
  async getByClass(@Param('classId') classId: string) {
    return this.childrenService.getChildrenByClass(classId);
  }

  @Patch(':id/medical-info')
  async updateMedicalInfo(@Param('id') id: string, @Body() medicalInfo: any) {
    return this.childrenService.updateMedicalInfo(id, medicalInfo);
  }
}
