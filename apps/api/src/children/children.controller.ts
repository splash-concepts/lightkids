import { Controller, Post, Body, Get, Param, Patch, UseGuards, Req, UseInterceptors, UploadedFiles, UnauthorizedException } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { ChildrenService } from './children.service.js';
import { diskStorage } from 'multer';

@Controller('children')
@UseGuards(AuthGuard('jwt'))
export class ChildrenController {
  constructor(private readonly childrenService: ChildrenService) {}

  @Post()
  @UseInterceptors(FilesInterceptor('caregiverImages', 5, {
    storage: diskStorage({
      destination: './uploads/caregivers',
      filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
    })
  }))
  async register(@Body() body: any, @Req() req: any, @UploadedFiles() files: Array<Express.Multer.File>) {
    const caregiverImages = files?.map(f => `/uploads/caregivers/${f.filename}`) || [];
    return this.childrenService.registerChild({ ...body, caregiverImages }, req.user.userId, req.user.role, req.user.branchId);
  }

  @Get('categories')
  async getCategories(@Req() req: any) {
    return this.childrenService.getCategories(req.user.branchId);
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
