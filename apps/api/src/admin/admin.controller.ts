import { Controller, Get, Param, Query, UseGuards, Req, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AdminService } from './admin.service.js';

@Controller('admin')
@UseGuards(AuthGuard('jwt'))
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  private checkAdmin(req: any) {
    if (req.user.role !== 'ADMIN') {
      throw new UnauthorizedException('Admin access required');
    }
  }

  @Get('stats')
  async getStats(@Req() req: any) {
    this.checkAdmin(req);
    return this.adminService.getStats();
  }

  @Get('users')
  async getUsers(@Query('role') role: string, @Req() req: any) {
    this.checkAdmin(req);
    return this.adminService.getUsers(role);
  }

  @Get('children')
  async getChildren(@Req() req: any) {
    this.checkAdmin(req);
    return this.adminService.getChildren();
  }

  @Get('children/:id')
  async getChild(@Param('id') id: string, @Req() req: any) {
    this.checkAdmin(req);
    return this.adminService.getChild(id);
  }

  @Get('attendance')
  async getAttendanceHistory(@Req() req: any) {
    this.checkAdmin(req);
    return this.adminService.getAttendanceHistory();
  }
}
