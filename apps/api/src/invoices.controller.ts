import { BadRequestException, Body, Controller, Get, Param, Post, Query, Res, UploadedFile, UseGuards, UseInterceptors, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles, RolesGuard } from './roles.guard';
import { PrismaService } from './prisma.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ParseFilePipe, MaxFileSizeValidator } from '@nestjs/common';
import { Response } from 'express';
import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

class CreateInvoiceDto {
  @IsString() @IsNotEmpty()
  invoiceNumber!: string;

  @IsString() @IsNotEmpty()
  companyName!: string;

  @IsOptional() @IsDateString()
  invoiceDate?: string; // ISO string; default now if not provided

  @IsNumber() @Min(0)
  @Type(() => Number)
  total!: number;
}

@Controller('invoices')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('JEFE_LOCAL', 'ADMIN')
export class InvoicesController {
  constructor(private readonly prisma: PrismaService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  async create(
    @Body() dto: CreateInvoiceDto,
    @UploadedFile(new ParseFilePipe({ validators: [new MaxFileSizeValidator({ maxSize: 15 * 1024 * 1024 })], fileIsRequired: true })) file: any,
    @Req() req?: any,
  ) {
    if (!file) throw new BadRequestException('Debe adjuntar un archivo');
    const fileType = file.mimetype as string;
    const allowed = /^(image\/|application\/pdf$)/;
    if (!allowed.test(fileType)) {
      throw new BadRequestException('Formato no soportado. Use imágenes o PDF.');
    }
  const data = await (this.prisma as any).purchaseInvoice.create({
      data: {
        invoiceNumber: dto.invoiceNumber,
        companyName: dto.companyName,
        invoiceDate: dto.invoiceDate ? new Date(dto.invoiceDate) : new Date(),
  uploadedAt: new Date(),
        total: dto.total as any,
        fileData: file.buffer,
        fileType,
        fileName: file.originalname,
        createdById: req?.user?.id ?? undefined,
      },
    });
    return { id: data.id };
  }

  @Get()
  async list(
    @Query('date') date?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('q') q?: string,
  ) {
    let gte: Date | undefined; let lt: Date | undefined;
    if (date) {
      const d = new Date(date);
      gte = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
      lt = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1, 0, 0, 0);
    } else if (from || to) {
      if (from) gte = new Date(from);
      if (to) lt = new Date(to);
    }
    const where: any = {};
    if (gte || lt) where.invoiceDate = { gte, lt };
    if (q) where.OR = [
      { invoiceNumber: { contains: q, mode: 'insensitive' } },
      { companyName: { contains: q, mode: 'insensitive' } },
    ];
  const rows = await (this.prisma as any).purchaseInvoice.findMany({ where, orderBy: { invoiceDate: 'desc' }, select: { id: true, invoiceNumber: true, companyName: true, invoiceDate: true, uploadedAt: true, total: true, fileType: true, fileName: true } });
    return rows;
  }

  @Get(':id/file')
  async file(@Param('id') id: string, @Res() res: Response) {
  const row = await (this.prisma as any).purchaseInvoice.findUnique({ where: { id }, select: { fileData: true, fileType: true, fileName: true } });
    if (!row) throw new BadRequestException('No encontrado');
    res.setHeader('Content-Type', row.fileType);
    if (row.fileName) res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(row.fileName)}"`);
    return res.send(row.fileData);
  }
}
