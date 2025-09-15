import { Controller, Get, Post, Body, Param, Patch, Delete, UploadedFile, UseInterceptors, Res, ParseFilePipe, MaxFileSizeValidator, FileTypeValidator, Query } from '@nestjs/common';
import { ProductsService } from './products.service';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles, RolesGuard } from './roles.guard';
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { Response } from 'express';

class CreateProductDto {
  @IsString() @IsNotEmpty()
  name!: string;

  @IsNumber() @Min(0)
  @Type(() => Number)
  price!: number;

  // Nuevo: tamaño opcional (variant name), categoría obligatoria por nombre, cantidad opcional, imagen opcional
  @IsOptional() @IsString()
  size?: string;

  @IsString() @IsNotEmpty()
  category!: string;

  // Tipo de producto (por nombre)
  @IsOptional() @IsString()
  type?: string;

  @IsOptional() @IsNumber() @Min(0)
  @Type(() => Number)
  quantity?: number;

  @IsOptional() @IsString()
  imageUrl?: string; // compat cuando no se sube archivo

  @IsOptional() @IsString()
  description?: string;

  @IsOptional() @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true || value === 1 || value === '1')
  isSellable?: boolean;

  @IsOptional() @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true || value === 1 || value === '1')
  isStockItem?: boolean;

  @IsOptional() @IsNumber() @Min(0)
  @Type(() => Number)
  cost?: number; // costo de la variante principal

  @IsOptional() @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true || value === 1 || value === '1')
  active?: boolean; // estado de la variante principal
}

class UpdateProductDto {
  @IsOptional() @IsString() @IsNotEmpty()
  name?: string;

  @IsOptional() @IsNumber() @Min(0)
  @Type(() => Number)
  price?: number;

  @IsOptional() @IsString() @IsNotEmpty()
  category?: string;

  // Tipo de producto (por nombre)
  @IsOptional() @IsString() @IsNotEmpty()
  type?: string;

  @IsOptional() @IsNumber() @Min(0)
  @Type(() => Number)
  quantity?: number;

  @IsOptional() @IsString()
  imageUrl?: string; // compat cuando no se sube archivo

  @IsOptional() @IsString()
  description?: string;

  @IsOptional() @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true || value === 1 || value === '1')
  isSellable?: boolean;

  @IsOptional() @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true || value === 1 || value === '1')
  isStockItem?: boolean;

  @IsOptional() @IsNumber() @Min(0)
  @Type(() => Number)
  cost?: number;

  @IsOptional() @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true || value === 1 || value === '1')
  active?: boolean;

  @IsOptional() @IsString()
  size?: string;
}

@Controller('products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get()
  list(@Query('typeId') typeId?: string, @Query('type') typeName?: string) {
    return this.products.list({ typeId, typeName });
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'JEFE_LOCAL')
  @UseInterceptors(FileInterceptor('image', { storage: memoryStorage() }))
  create(
    @Body() dto: CreateProductDto,
  @UploadedFile(new ParseFilePipe({ validators: [new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), new FileTypeValidator({ fileType: /^image\// })], fileIsRequired: false })) file?: any,
  ) {
    const image = file ? { buffer: file.buffer, mimetype: file.mimetype } : undefined;
    // convertir números si vienen como string en multipart
    if (dto && (dto as any).price) (dto as any).price = Number((dto as any).price);
    if (dto && (dto as any).quantity) (dto as any).quantity = Number((dto as any).quantity);
    if (dto && (dto as any).cost) (dto as any).cost = Number((dto as any).cost);
    // booleanos
    const toBool = (v: any) => (typeof v === 'string' ? v === 'true' : !!v);
    if ((dto as any).isSellable !== undefined) (dto as any).isSellable = toBool((dto as any).isSellable);
    if ((dto as any).isStockItem !== undefined) (dto as any).isStockItem = toBool((dto as any).isStockItem);
    if ((dto as any).active !== undefined) (dto as any).active = toBool((dto as any).active);
    return this.products.create({ ...(dto as any), image } as any);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.products.get(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'JEFE_LOCAL')
  @UseInterceptors(FileInterceptor('image', { storage: memoryStorage() }))
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  @UploadedFile(new ParseFilePipe({ validators: [new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), new FileTypeValidator({ fileType: /^image\// })], fileIsRequired: false })) file?: any,
  ) {
    const image = file ? { buffer: file.buffer, mimetype: file.mimetype } : undefined;
    if (dto && (dto as any).price) (dto as any).price = Number((dto as any).price);
    if (dto && (dto as any).quantity) (dto as any).quantity = Number((dto as any).quantity);
    if (dto && (dto as any).cost) (dto as any).cost = Number((dto as any).cost);
    const toBool = (v: any) => (typeof v === 'string' ? v === 'true' : !!v);
    if ((dto as any).isSellable !== undefined) (dto as any).isSellable = toBool((dto as any).isSellable);
    if ((dto as any).isStockItem !== undefined) (dto as any).isStockItem = toBool((dto as any).isStockItem);
    if ((dto as any).active !== undefined) (dto as any).active = toBool((dto as any).active);
    return this.products.update(id, { ...(dto as any), image } as any);
  }

  // Servir la imagen almacenada
  @Get(':id/image')
  async getImage(@Param('id') id: string, @Res() res: Response) {
    const data = await this.products.getImage(id);
    if (!data) return res.status(404).send('Not found');
    res.setHeader('Content-Type', data.mimetype);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    return res.send(data.buffer);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'JEFE_LOCAL')
  remove(@Param('id') id: string) {
    return this.products.remove(id);
  }
}
