import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ServiceLinksController } from './service-links.controller.js';
import { ServiceLinksService } from './service-links.service.js';
import { ServiceLink, ServiceLinkSchema } from '../schemas/service-link.schema.js';

@Module({
  imports: [MongooseModule.forFeature([{ name: ServiceLink.name, schema: ServiceLinkSchema }])],
  controllers: [ServiceLinksController],
  providers: [ServiceLinksService]
})
export class ServiceLinksModule {}
