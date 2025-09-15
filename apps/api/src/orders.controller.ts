import { Body, Controller, Get, Param, Post, UseGuards, BadRequestException, Query, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles, RolesGuard } from './roles.guard';
import { PrismaService } from './prisma.service';
import { IsArray, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class OrderItemDto {
  @IsString() @IsNotEmpty()
  productVariantId!: string;

  @IsOptional() @IsString()
  description?: string; // item name + variant + note

  @IsNumber() @Min(1) @Type(() => Number)
  qty!: number;

  @IsNumber() @Min(0) @Type(() => Number)
  unitPrice!: number;
}

enum PaymentMethodDto { EFECTIVO='EFECTIVO', TARJETA='TARJETA', TRANSFERENCIA='TRANSFERENCIA', QR='QR', OTRO='OTRO' }

class CreateOrderDto {
  @IsArray() @ValidateNested({ each: true }) @Type(() => OrderItemDto)
  items!: OrderItemDto[];

  @IsOptional() @IsNumber() @Type(() => Number)
  tip?: number;

  @IsOptional() @IsNumber() @Type(() => Number)
  discount?: number;
}

class AddPaymentDto {
  @IsEnum(PaymentMethodDto)
  method!: PaymentMethodDto;

  @IsNumber() @Min(0) @Type(() => Number)
  amount!: number;
}

@Controller('orders')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('VENDEDOR', 'JEFE_LOCAL', 'ADMIN')
export class OrdersController {
  constructor(private readonly prisma: PrismaService) {}

  @Post()
  async create(@Body() dto: CreateOrderDto, @Req() req: any) {
    // Calculate totals
    const subtotal = dto.items.reduce((a, it) => a + it.unitPrice * it.qty, 0);
    const tip = dto.tip ?? 0;
    const discount = dto.discount ?? 0;
    const total = subtotal + tip - discount;
    // Create order + items, and decrement stock of variants
    const result = await this.prisma.$transaction(async (tx) => {
  const order = await tx.order.create({ data: ({ channel: 'SALON', status: 'ENTREGADO', subtotal, tax: 0, tip, discount, total, userId: req?.user?.id, closedAt: new Date() } as any) });
      for (const it of dto.items) {
        await tx.orderItem.create({ data: { orderId: order.id, productVariantId: it.productVariantId, description: it.description ?? '', qty: it.qty as any, unitPrice: it.unitPrice as any, total: (it.unitPrice * it.qty) as any } });
        // decrement stock if quantity tracked
        const variant = await tx.productVariant.findUnique({ where: { id: it.productVariantId }, include: { product: true } });
        if (variant && variant.product.isStockItem) {
          const remaining = Number(variant.quantity) - Number(it.qty);
          if (remaining < 0) {
            throw new BadRequestException(`Stock insuficiente para ${variant.product.name} (${variant.name}). Disponible: ${variant.quantity}`);
          }
          const newQty = remaining as any;
          await tx.productVariant.update({ where: { id: variant.id }, data: { quantity: newQty } });
        }
      }
      return order;
    });
    return result;
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    return this.prisma.order.findUnique({ where: { id }, include: { items: true, payments: true } });
  }

  @Post(':id/payments')
  async addPayment(@Param('id') id: string, @Body() dto: AddPaymentDto) {
    const payment = await this.prisma.payment.create({ data: { orderId: id, method: dto.method as any, amount: dto.amount as any } });
    return payment;
  }

  @Get()
  async list(
    @Query('date') date?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    let gte: Date | undefined; let lt: Date | undefined;
    if (date) {
      const d = new Date(date);
      gte = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
      lt = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1, 0, 0, 0);
    } else if (from || to) {
      if (from) gte = new Date(from);
      if (to) lt = new Date(to);
    } else {
      // default today
      const now = new Date();
      gte = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      lt = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
    }
    return this.prisma.order.findMany({
      where: { openedAt: { gte, lt } },
      orderBy: { openedAt: 'desc' },
      include: { items: true, payments: true },
    });
  }
}
