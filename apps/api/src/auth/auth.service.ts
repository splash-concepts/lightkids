import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { OTP } from 'otplib';
const authenticator = new OTP({ strategy: 'totp' });
import { User, UserDocument, UserRole } from '../schemas/user.schema.js';

import { Branch, BranchDocument } from '../schemas/branch.schema.js';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Branch.name) private branchModel: Model<BranchDocument>,
    private jwtService: JwtService,
  ) {}

  async getPublicBranches() {
    return this.branchModel.find().select('name location').sort({ name: 1 });
  }

  async register(data: any) {
    const { name, email, password, role, branchId, phoneNumber, whatsappNumber } = data;
    const existingUser = await this.userModel.findOne({ email });
    if (existingUser) throw new BadRequestException('Email already in use');

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await this.userModel.create({
      name,
      email,
      password: hashedPassword,
      role,
      branchId,
      phoneNumber,
      whatsappNumber,
    });
    return { message: 'User registered successfully' };
  }

  async login(data: any) {
    const { email, password, token } = data; // token is for 2FA
    const user = await this.userModel.findOne({ email });
    
    if (!user || !user.password || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.isTwoFactorEnabled) {
      if (!token) throw new UnauthorizedException('2FA_REQUIRED');
      if (!user.twoFactorSecret) throw new UnauthorizedException('2FA not properly configured');
      const result = authenticator.verifySync({ token, secret: user.twoFactorSecret });
      if (!result.valid) throw new UnauthorizedException('Invalid 2FA token');
    }

    const payload = { sub: user._id, email: user.email, role: user.role, branchId: user.branchId };
    return {
      access_token: this.jwtService.sign(payload),
      role: user.role,
      name: user.name,
      require2faSetup: user.role === UserRole.MENTOR && !user.isTwoFactorEnabled
    };
  }

  async generateTwoFactorSecret(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new UnauthorizedException('User not found');
    
    const secret = authenticator.generateSecret();
    const otpauthUrl = authenticator.generateURI({
      issuer: 'LightKids',
      label: user.email,
      secret
    });
    
    user.twoFactorSecret = secret;
    await user.save();

    return { secret, otpauthUrl };
  }

  async turnOnTwoFactor(userId: string, token: string) {
    const user = await this.userModel.findById(userId);
    if (!user || !user.twoFactorSecret) throw new UnauthorizedException('User not found or 2FA not initialized');
    
    const result = authenticator.verifySync({ token, secret: user.twoFactorSecret });
    if (!result.valid) throw new UnauthorizedException('Invalid token');
    
    user.isTwoFactorEnabled = true;
    await user.save();
    return { message: '2FA enabled successfully' };
  }
}
