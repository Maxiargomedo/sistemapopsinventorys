import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(params?: { typeId?: string; typeName?: string }) {
    const where: any = { isSellable: true, variants: { some: { active: true } } };
    if (params?.typeId) where.typeId = params.typeId;
    if (params?.typeName) where.type = { name: params.typeName };
    return (this.prisma as any).product.findMany({
      where,
      include: { variants: true, category: true, type: true },
      orderBy: { name: 'asc' },
    });
  }

  async create(dto: { name: string; price: number; size?: string; category: string; type?: string; quantity?: number; imageUrl?: string; image?: { buffer: Buffer; mimetype: string }; description?: string; isSellable?: boolean; isStockItem?: boolean; cost?: number; active?: boolean }) {
    // Validate: category must match an existing ProductType name
    const typeMatch = await (this.prisma as any).productType.findUnique({ where: { name: dto.category } });
    if (!typeMatch) {
      throw new BadRequestException('Categoría inválida: debe coincidir con un Tipo de producto existente');
    }
    // Ensure category exists (category table)
    const cat = await this.prisma.category.upsert({
      where: { name: dto.category },
      update: {},
      create: { name: dto.category },
    });

    let typeConnect: any = undefined;
    if (dto.type) {
      const t = await (this.prisma as any).productType.upsert({ where: { name: dto.type }, update: {}, create: { name: dto.type } });
      typeConnect = { connect: { id: t.id } };
    } else if (typeMatch) {
      // If type not provided, connect the product to the matching type by category
      typeConnect = { connect: { id: typeMatch.id } };
    }

  return this.prisma.product.create({
      data: {
        name: dto.name,
        isSellable: dto.isSellable ?? true,
        isStockItem: dto.isStockItem ?? false,
        description: dto.description,
        imageUrl: dto.imageUrl,
        ...(dto.image ? { imageData: dto.image.buffer, imageType: dto.image.mimetype } : {}),
    category: { connect: { id: cat.id } },
        ...(typeConnect ? { type: typeConnect } : {}),
        variants: {
          create: [{ name: dto.size ?? 'Único', price: dto.price, quantity: dto.quantity ?? 0, cost: dto.cost, active: dto.active ?? true }],
        },
      },
      include: { variants: true },
    });
  }

  async get(id: string) {
    return (this.prisma as any).product.findUnique({
      where: { id },
      include: { variants: true, category: true, type: true },
    });
  }

  async update(id: string, dto: { name?: string; price?: number; category?: string; type?: string; quantity?: number; imageUrl?: string; image?: { buffer: Buffer; mimetype: string }; description?: string; isSellable?: boolean; isStockItem?: boolean; cost?: number; active?: boolean; size?: string }) {
  let categoryUpdate: any = {};
    if (dto.category) {
      // Validate: category must match an existing ProductType name
      const typeMatch = await (this.prisma as any).productType.findUnique({ where: { name: dto.category } });
      if (!typeMatch) {
        throw new BadRequestException('Categoría inválida: debe coincidir con un Tipo de producto existente');
      }
      const cat = await this.prisma.category.upsert({
        where: { name: dto.category },
        update: {},
        create: { name: dto.category },
      });
  categoryUpdate.category = { connect: { id: cat.id } };
    }
    let typeUpdate: any = {};
    if (dto.type) {
      const t = await (this.prisma as any).productType.upsert({ where: { name: dto.type }, update: {}, create: { name: dto.type } });
      typeUpdate.type = { connect: { id: t.id } };
    }
    return this.prisma.product.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        ...(dto.isSellable !== undefined ? { isSellable: dto.isSellable } : {}),
        ...(dto.isStockItem !== undefined ? { isStockItem: dto.isStockItem } : {}),
        imageUrl: dto.imageUrl,
        ...(dto.image ? { imageData: dto.image.buffer, imageType: dto.image.mimetype } : {}),
        ...categoryUpdate,
        ...typeUpdate,
        ...(typeof dto.price === 'number' || typeof dto.quantity === 'number' || typeof dto.cost === 'number' || dto.active !== undefined || dto.size !== undefined
          ? { variants: { updateMany: { where: { active: true }, data: { ...(typeof dto.price === 'number' ? { price: dto.price } : {}), ...(typeof dto.quantity === 'number' ? { quantity: dto.quantity } : {}), ...(typeof dto.cost === 'number' ? { cost: dto.cost } : {}), ...(dto.active !== undefined ? { active: dto.active } : {}), ...(dto.size !== undefined ? { name: dto.size } : {}) } } } }
          : {}),
      },
      include: { variants: true },
    });
  }

  async remove(id: string) {
    // Prefer hard delete. If FK constraints (orders/items) block deletion, perform a soft delete instead.
    try {
      await this.prisma.productVariant.deleteMany({ where: { productId: id } });
      return await this.prisma.product.delete({ where: { id } });
    } catch (err) {
      // Soft delete: mark product as not sellable and deactivate all variants
      await this.prisma.product.update({ where: { id }, data: { isSellable: false } });
      await this.prisma.productVariant.updateMany({ where: { productId: id }, data: { active: false } });
      // Return the updated product (now non-sellable)
      return this.prisma.product.findUnique({ where: { id }, include: { variants: true } }) as any;
    }
  }

  async getImage(id: string): Promise<{ buffer: Buffer; mimetype: string } | null> {
    const prod: any = await (this.prisma as any).product.findUnique({ where: { id }, select: { imageData: true, imageType: true } });
    if (!prod || !prod.imageData || !prod.imageType) return null;
    return { buffer: Buffer.from(prod.imageData), mimetype: prod.imageType };
  }
}
