import { Controller, Post, Body, Req, UseGuards, Get, Patch, UseInterceptors, UploadedFile } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { getCloudinaryStorage } from '../utils/cloudinary.util.js';
import { AuthService } from './auth.service.js';
import * as qrcode from 'qrcode';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('branches')
  async getBranches() {
    return this.authService.getPublicBranches();
  }

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

  @UseGuards(AuthGuard('jwt'))
  @Patch('profile/image')
  @UseInterceptors(FileInterceptor('image', {
    storage: getCloudinaryStorage('caregivers')
  }))
  async uploadProfileImage(@Req() req: any, @UploadedFile() file: Express.Multer.File) {
    const imageUrl = file?.path?.startsWith('http') ? file.path : (file?.filename ? `/uploads/caregivers/${file.filename}` : null);
    if (!imageUrl) return { success: false };
    await this.authService.updateProfileImage(req.user.userId, imageUrl);
    return { success: true, imageUrl };
  }
}
