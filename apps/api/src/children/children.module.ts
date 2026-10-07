import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChildrenService } from './children.service.js';
import { ChildrenController } from './children.controller.js';
import { Child, ChildSchema } from '../schemas/child.schema.js';
import { ClassCategory, ClassCategorySchema } from '../schemas/class-category.schema.js';

@Module({
  imports: [MongooseModule.forFeature([
    { name: Child.name, schema: ChildSchema },
    { name: ClassCategory.name, schema: ClassCategorySchema }
  ])],
  controllers: [ChildrenController],
  providers: [ChildrenService],
})
export class ChildrenModule {}
