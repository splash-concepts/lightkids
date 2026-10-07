import { Controller, Post, Body, Get, UseGuards, Req, Param, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { HandoffService } from './handoff.service.js';
import { HandoffType } from '../schemas/handoff-log.schema.js';

@Controller('handoff')
@UseGuards(AuthGuard('jwt'))
export class HandoffController {
  constructor(private readonly handoffService: HandoffService) {}

  @Get('verify/:code')
  async verifyCode(@Param('code') code: string) {
    return this.handoffService.verifyCode(code);
  }

  @Post()
  async logHandoff(@Body() body: { childId: string, type: HandoffType, code: string }, @Req() req: any) {
    if (req.user.role !== 'MENTOR' && req.user.role !== 'ADMIN') {
      throw new UnauthorizedException('Only Mentors and Admins can log handoffs');
    }
    return this.handoffService.logHandoff(body.childId, body.type, body.code, req.user.userId);
  }

  @Get('recent')
  async getRecentLogs() {
    return this.handoffService.getRecentLogs(50);
  }
}
