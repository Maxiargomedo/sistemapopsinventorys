import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { IsNotEmpty, IsString } from 'class-validator';

class ProductTypeDto { @IsString() @IsNotEmpty() name!: string; }

@Controller('product-types')
export class ProductTypesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list() { return (this.prisma as any).productType.findMany({ orderBy: { name: 'asc' } }); }

  @Post()
  async create(@Body() dto: ProductTypeDto) { return (this.prisma as any).productType.create({ data: { name: dto.name } }); }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: ProductTypeDto) { return (this.prisma as any).productType.update({ where: { id }, data: { name: dto.name } }); }

  @Delete(':id')
  async remove(@Param('id') id: string) { return (this.prisma as any).productType.delete({ where: { id } }); }
}
