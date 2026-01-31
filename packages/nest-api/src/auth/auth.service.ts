import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService
  ) {}

  async register(data: { email: string; password: string; username?: string }) {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await this.prisma.userDashboard.create({
      data: {
        email: data.email,
        username: data.username,
        password: hashedPassword,
        userType: 'FREE',
        createdAt: new Date(),
      },
    });
    return { id: user.id, email: user.email, username: user.username };
  }

  async login(email: string, password: string) {
    const user = await this.prisma.userDashboard.findUnique({
      where: { email },
    });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const payload = {
      sub: user.id,
      email: user.email,
      userType: user.userType,
    };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        userType: user.userType,
      },
    };
  }
}
