import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Req, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AdminService } from './admin.service.js';

@Controller('admin')
@UseGuards(AuthGuard('jwt'))
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  private checkAdmin(req: any) {
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      throw new UnauthorizedException('Admin access required');
    }
  }

  private checkStaff(req: any) {
    if (req.user.role === 'PARENT') {
      throw new UnauthorizedException('Staff access required');
    }
  }

  private checkSuperAdmin(req: any) {
    if (req.user.role !== 'SUPER_ADMIN') {
      throw new UnauthorizedException('Super Admin access required');
    }
  }

  @Get('stats')
  async getStats(@Req() req: any) {
    this.checkAdmin(req);
    const branchId = req.user.role === 'SUPER_ADMIN' ? undefined : req.user.branchId;
    return this.adminService.getStats(branchId);
  }

  @Get('users')
  async getUsers(@Query('role') role: string, @Req() req: any) {
    this.checkStaff(req);
    const branchId = req.user.role === 'SUPER_ADMIN' ? undefined : req.user.branchId;
    return this.adminService.getUsers(role, branchId);
  }

  @Get('children')
  async getChildren(@Req() req: any) {
    this.checkStaff(req);
    const branchId = req.user.role === 'SUPER_ADMIN' ? undefined : req.user.branchId;
    return this.adminService.getChildren(branchId);
  }

  @Get('children/:id')
  async getChild(@Param('id') id: string, @Req() req: any) {
    this.checkAdmin(req);
    return this.adminService.getChild(id);
  }

  @Get('attendance')
  async getAttendanceHistory(@Req() req: any) {
    this.checkAdmin(req);
    const branchId = req.user.role === 'SUPER_ADMIN' ? undefined : req.user.branchId;
    return this.adminService.getAttendanceHistory(branchId);
  }

  // Multi-Tenancy / Branch Management
  @Post('branches')
  async createBranch(@Body() body: { name: string; location?: string; contactEmail?: string }, @Req() req: any) {
    this.checkSuperAdmin(req);
    return this.adminService.createBranch(body);
  }

  @Get('branches')
  async getBranches(@Req() req: any) {
    this.checkSuperAdmin(req);
    return this.adminService.getBranches();
  }

  // Class Management per Branch
  @Post('class-categories')
  async createClassCategory(@Body() body: { name: string; description?: string; branchId: string; ageMin?: number; ageMax?: number }, @Req() req: any) {
    this.checkAdmin(req);
    // If not SUPER_ADMIN, force the branchId to be the admin's branchId
    if (req.user.role !== 'SUPER_ADMIN') {
      body.branchId = req.user.branchId;
    }
    return this.adminService.createClassCategory(body);
  }

  @Get('class-categories')
  async getClassCategories(@Query('branchId') branchId: string, @Req() req: any) {
    this.checkAdmin(req);
    const targetBranchId = req.user.role === 'SUPER_ADMIN' ? (branchId || undefined) : req.user.branchId;
    return this.adminService.getClassCategories(targetBranchId);
  }

  @Patch('class-categories/:id')
  async updateClassCategory(@Param('id') id: string, @Body() body: { name?: string; description?: string; mentorIds?: string[]; ageMin?: number; ageMax?: number }, @Req() req: any) {
    this.checkAdmin(req);
    return this.adminService.updateClassCategory(id, body, req.user.branchId);
  }

  // User Management
  @Post('users/:id/transfer')
  async transferUser(@Param('id') userId: string, @Body() body: { branchId: string }, @Req() req: any) {
    this.checkSuperAdmin(req);
    return this.adminService.transferUserBranch(userId, body.branchId);
  }

  @Patch('users/:id/role')
  async updateUserRole(@Param('id') userId: string, @Body() body: { role: string }, @Req() req: any) {
    this.checkSuperAdmin(req);
    return this.adminService.updateUserRole(userId, body.role);
  }
}
