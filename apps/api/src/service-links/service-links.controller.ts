import { Controller, Get, Post, Body, Param, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ServiceLinksService } from './service-links.service.js';

@Controller('service-links')
@UseGuards(AuthGuard('jwt'))
export class ServiceLinksController {
  constructor(private readonly linksService: ServiceLinksService) {}

  @Post()
  async createLink(@Body() body: any, @Req() req: any) {
    return this.linksService.createLink({
      title: body.title,
      url: body.url,
      branchId: req.user.branchId
    }, req.user.role);
  }

  @Get()
  async getLinks(@Req() req: any) {
    return this.linksService.getLinks(req.user);
  }

  @Post(':id/view')
  async markViewed(@Param('id') id: string, @Req() req: any) {
    return this.linksService.markAsViewed(id, req.user.userId);
  }
}
