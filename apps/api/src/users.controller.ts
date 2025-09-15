import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { Roles, RolesGuard } from './roles.guard';
import { AuthGuard } from '@nestjs/passport';
import * as bcrypt from 'bcryptjs';

class CreateUserDto {
  email!: string;
  password!: string;
  confirmPassword!: string;
  fullName!: string;
  role?: 'ADMIN' | 'VENDEDOR' | 'JEFE_LOCAL';
}

class UpdateUserDto {
  fullName?: string;
  role?: 'ADMIN' | 'VENDEDOR' | 'JEFE_LOCAL';
  isActive?: boolean;
  password?: string;
  confirmPassword?: string;
}

@Controller('users')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('ADMIN')
export class UsersController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async list() {
    return this.prisma.user.findMany({ select: { id: true, email: true, fullName: true, role: true, isActive: true, createdAt: true } as any });
  }

  @Post()
  async create(@Body() dto: CreateUserDto) {
    if (dto.password !== dto.confirmPassword) throw new Error('Las contraseñas no coinciden');
    const exists = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (exists) throw new Error('El correo ya está registrado');
    const hash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: { email: dto.email, fullName: dto.fullName, password: hash, role: (dto.role || 'VENDEDOR') as any, isActive: true } as any,
      select: { id: true, email: true, fullName: true, role: true, isActive: true } as any,
    } as any);
    return user;
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    const data: any = {};
    if (dto.fullName !== undefined) data.fullName = dto.fullName;
    if (dto.role !== undefined) data.role = dto.role;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    if (dto.password) {
      if (dto.password !== dto.confirmPassword) throw new Error('Las contraseñas no coinciden');
      data.password = await bcrypt.hash(dto.password, 10);
    }
    return this.prisma.user.update({ where: { id }, data, select: { id: true, email: true, fullName: true, role: true, isActive: true } as any } as any);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.prisma.user.delete({ where: { id }, select: { id: true, email: true } as any } as any);
  }
}
