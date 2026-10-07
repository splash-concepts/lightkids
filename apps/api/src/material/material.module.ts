import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MaterialService } from './material.service.js';
import { MaterialController } from './material.controller.js';
import { AcademicMaterial, AcademicMaterialSchema } from '../schemas/academic-material.schema.js';

@Module({
  imports: [MongooseModule.forFeature([{ name: AcademicMaterial.name, schema: AcademicMaterialSchema }])],
  controllers: [MaterialController],
  providers: [MaterialService],
})
export class MaterialModule {}
