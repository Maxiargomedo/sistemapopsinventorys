import { Body, Controller, Get, Put, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles, RolesGuard } from './roles.guard';
import { PrismaService } from './prisma.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { IsEmail, IsInt, IsOptional, IsString, Min } from 'class-validator';

class SettingsDto {
  @IsOptional() @IsString() companyName?: string;
  @IsOptional() @IsString() rut?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() receiptMessage?: string;
  @IsOptional() @IsString() currency?: string;
  @IsOptional() @IsString() dateTimeFormat?: string;
  @IsOptional() @IsString() taxName?: string;
  @IsOptional() @IsString() documentType?: string;
  @IsOptional() @IsInt() @Min(0) autoCopies?: number;
  @IsOptional() taxRate?: any; // validated in code as number
}

@Controller('settings')
export class SettingsController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async get() {
    const s = await (this.prisma as any).settings.findUnique({ where: { id: 'default' } });
    if (!s) return { id: 'default', currency: 'CLP', dateTimeFormat: 'DD/MM/YYYY HH:mm', taxName: 'IVA', taxRate: 0, autoCopies: 1 };
    const { logoData, logoType, ...rest } = s;
    return { ...rest, hasLogo: !!(logoData && logoType) };
  }

  @Put()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  @UseInterceptors(FileInterceptor('logo', { storage: memoryStorage() }))
  async update(@Body() body: SettingsDto, @UploadedFile() file?: any) {
    const data: any = { ...body };
    if (typeof body.taxRate !== 'undefined') {
      const n = Number(body.taxRate);
      if (!Number.isFinite(n) || n < 0) throw new Error('taxRate inválido');
      data.taxRate = n;
    }
    if (typeof body.autoCopies !== 'undefined') data.autoCopies = Number(body.autoCopies);
    if (file && file.buffer && file.mimetype) {
      data.logoData = file.buffer;
      data.logoType = file.mimetype;
    }
    await (this.prisma as any).settings.upsert({
      where: { id: 'default' },
      update: data,
      create: { id: 'default', ...data },
    });
    return this.get();
  }
}
