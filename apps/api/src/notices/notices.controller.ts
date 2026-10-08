import { Controller, Post, Body, Get, UseGuards, Req, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { NoticesService } from './notices.service.js';

@Controller('notices')
@UseGuards(AuthGuard('jwt'))
export class NoticesController {
  constructor(private readonly noticesService: NoticesService) {}

  @Post('event')
  async createEvent(@Body() body: any, @Req() req: any) {
    if (req.user.role !== 'ADMIN') {
      throw new UnauthorizedException('Only Admins can create events');
    }
    return this.noticesService.createEvent(body, req.user.userId, req.user.branchId);
  }

  @Post('update')
  async createParentUpdate(@Body() body: any, @Req() req: any) {
    return this.noticesService.createParentUpdate(body, req.user.userId, req.user.branchId);
  }

  @Get()
  async getNotices(@Req() req: any) {
    return this.noticesService.getNoticesForUser(req.user.userId, req.user.role, req.user.branchId);
  }
}
