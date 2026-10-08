import { Controller, Post, Body, Get, Param, Query, UseGuards, Req, UseInterceptors, UploadedFile, UnauthorizedException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { MaterialService } from './material.service.js';
import { MaterialType } from '../schemas/academic-material.schema.js';
import { diskStorage } from 'multer';

@Controller('materials')
@UseGuards(AuthGuard('jwt'))
export class MaterialController {
  constructor(private readonly materialService: MaterialService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads/materials',
      filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
    })
  }))
  async uploadMaterial(@Body() body: any, @Req() req: any, @UploadedFile() file: Express.Multer.File) {
    if (req.user.role !== 'MENTOR' && req.user.role !== 'ADMIN') {
      throw new UnauthorizedException('Only Mentors and Admins can upload materials');
    }
    return this.materialService.uploadMaterial({
      ...body,
      fileUrl: file ? `/uploads/materials/${file.filename}` : undefined,
      authorId: req.user.userId,
      branchId: req.user.branchId,
    });
  }

  @Get('class/:classId')
  async getByClass(@Param('classId') classId: string, @Query('type') type: MaterialType, @Req() req: any) {
    return this.materialService.getMaterialsByClass(classId, req.user.branchId, type);
  }
}
