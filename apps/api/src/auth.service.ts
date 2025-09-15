import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
// Avoid tight coupling to generated enum types during migration; use string literals
import { RegisterDto, LoginDto } from './auth.controller';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService) {}

  private async ensureAdminSeed() {
    const adminEmail = 'maximilianoargomedolopez@gmail.com';
    const adminPass = 'Argomedo123';
    const existing = await this.prisma.user.findUnique({ where: { email: adminEmail } });
    if (!existing) {
      const hash = await bcrypt.hash(adminPass, 10);
      await this.prisma.user.create({
        data: { email: adminEmail, fullName: 'Administrador', password: hash, role: 'ADMIN', isActive: true } as any,
      } as any);
    }
  }

  async register(dto: RegisterDto) {
    await this.ensureAdminSeed();
    if (dto.password !== dto.confirmPassword) throw new BadRequestException('Las contraseñas no coinciden');
    const exists = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (exists) throw new BadRequestException('El correo ya está registrado');
    const hash = await bcrypt.hash(dto.password, 10);
    // New accounts via public register are VENDEDOR by default
    const user = await this.prisma.user.create({
      data: { email: dto.email, fullName: dto.fullName, password: hash, role: 'VENDEDOR', isActive: true } as any,
      select: { id: true, email: true, fullName: true, role: true, isActive: true } as any,
    } as any);
    return { user };
  }

  async login(dto: LoginDto) {
    await this.ensureAdminSeed();
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('Credenciales inválidas');
  if (!(user as any).isActive) throw new UnauthorizedException('Usuario inactivo');
    const ok = await bcrypt.compare(dto.password, user.password);
    if (!ok) throw new UnauthorizedException('Credenciales inválidas');
  const payload = { sub: user.id, role: (user as any).role, email: user.email, name: (user as any).fullName };
  const token = await this.jwt.signAsync(payload);
  return { access_token: token, user: { id: user.id, email: user.email, fullName: (user as any).fullName, role: (user as any).role } };
  }
}
