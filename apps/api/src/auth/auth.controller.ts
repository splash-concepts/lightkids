import { Controller, Post, Body, Req, UseGuards, Get } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import * as qrcode from 'qrcode';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() body: any) {
    return this.authService.register(body);
  }

  @Post('login')
  async login(@Body() body: any) {
    return this.authService.login(body);
  }

  // Simplified: Should be guarded by JWT in real app
  @Post('2fa/generate')
  async generate2fa(@Body('userId') userId: string) {
    const { otpauthUrl } = await this.authService.generateTwoFactorSecret(userId);
    const qrCodeUrl = await qrcode.toDataURL(otpauthUrl);
    return { qrCodeUrl };
  }

  @Post('2fa/turn-on')
  async turnOn2fa(@Body() body: { userId: string, token: string }) {
    return this.authService.turnOnTwoFactor(body.userId, body.token);
  }
}
