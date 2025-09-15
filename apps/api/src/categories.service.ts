import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.category.findMany({ orderBy: { name: 'asc' } });
  }

  create(dto: { name: string }) {
    return this.prisma.category.create({ data: { name: dto.name } });
  }

  update(id: string, dto: { name: string }) {
    return this.prisma.category.update({ where: { id }, data: { name: dto.name } });
  }

  remove(id: string) {
    return this.prisma.category.delete({ where: { id } });
  }
}
