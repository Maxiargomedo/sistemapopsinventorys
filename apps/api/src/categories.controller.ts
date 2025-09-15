import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { IsNotEmpty, IsString } from 'class-validator';

class CategoryDto { @IsString() @IsNotEmpty() name!: string; }

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @Get()
  list() { return this.categories.list(); }

  @Post()
  create(@Body() dto: CategoryDto) { return this.categories.create(dto); }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: CategoryDto) { return this.categories.update(id, dto); }

  @Delete(':id')
  remove(@Param('id') id: string) { return this.categories.remove(id); }
}
