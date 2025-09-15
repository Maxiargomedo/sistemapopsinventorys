import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles, RolesGuard } from './roles.guard';
import { PrismaService } from './prisma.service';

@Controller('reports')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('JEFE_LOCAL', 'ADMIN')
export class ReportsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('top-products')
  async topProducts(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit') limit = '10',
  ) {
    const gte = from ? new Date(from) : undefined;
    const lt = to ? new Date(to) : undefined;
    const rows = await this.prisma.$queryRawUnsafe<any[]>(`
      SELECT pv.id, p.name || CASE WHEN pv.name <> '' THEN ' · ' || pv.name ELSE '' END AS name,
             SUM(oi.qty) AS qty, SUM(oi.total) AS total
      FROM "OrderItem" oi
      JOIN "ProductVariant" pv ON pv.id = oi."productVariantId"
      JOIN "Product" p ON p.id = pv."productId"
      JOIN "Order" o ON o.id = oi."orderId"
      WHERE ($1::timestamptz IS NULL OR o."openedAt" >= $1)
        AND ($2::timestamptz IS NULL OR o."openedAt" < $2)
      GROUP BY pv.id, p.name, pv.name
      ORDER BY qty DESC
      LIMIT $3::int
    `, gte ?? null, lt ?? null, Number(limit));
    return rows;
  }

  @Get('sales-by-hour')
  async salesByHour(
    @Query('date') date?: string,
  ) {
    const d = date ? new Date(date) : new Date();
    const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
    const nextDay = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1, 0, 0, 0);
    const rows = await this.prisma.$queryRawUnsafe<any[]>(`
      SELECT date_part('hour', o."openedAt")::int AS hour, COUNT(*) AS orders, SUM(o.total) AS total
      FROM "Order" o
      WHERE o."openedAt" >= $1 AND o."openedAt" < $2
      GROUP BY 1
      ORDER BY 1
    `, dayStart as any, nextDay as any);
    return rows;
  }

  @Get('inventory-valuation')
  async inventoryValuation() {
    const rows = await this.prisma.$queryRawUnsafe<any[]>(`
      SELECT p.id, p.name, pv.id as variant_id, pv.name as variant_name, pv.quantity, pv.cost,
             (pv.quantity * COALESCE(pv.cost,0)) AS value
      FROM "Product" p
      JOIN "ProductVariant" pv ON pv."productId" = p.id
      ORDER BY p.name, pv.name
    `);
    const total = rows.reduce((a, r) => a + Number(r.value || 0), 0);
    return { items: rows, total };
  }

  @Get('low-rotation')
  async lowRotation(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('threshold') threshold = '3',
  ) {
    const gte = from ? new Date(from) : undefined;
    const lt = to ? new Date(to) : undefined;
    const rows = await this.prisma.$queryRawUnsafe<any[]>(`
      SELECT pv.id, p.name || CASE WHEN pv.name <> '' THEN ' · ' || pv.name ELSE '' END AS name,
             COALESCE(SUM(oi.qty),0) AS qty
      FROM "ProductVariant" pv
      JOIN "Product" p ON p.id = pv."productId"
      LEFT JOIN "OrderItem" oi ON oi."productVariantId" = pv.id
      LEFT JOIN "Order" o ON o.id = oi."orderId"
        AND ($1::timestamptz IS NULL OR o."openedAt" >= $1)
        AND ($2::timestamptz IS NULL OR o."openedAt" < $2)
      GROUP BY pv.id, p.name, pv.name
      HAVING COALESCE(SUM(oi.qty),0) <= $3::numeric
      ORDER BY qty ASC
    `, gte ?? null, lt ?? null, Number(threshold));
    return rows;
  }

  @Get('employees-sales')
  async employeesSales(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const gte = from ? new Date(from) : undefined;
    const lt = to ? new Date(to) : undefined;
    const rows = await this.prisma.$queryRawUnsafe<any[]>(`
      SELECT u.id, u."fullName" AS name, COUNT(o.id) AS orders, COALESCE(SUM(o.total),0) AS total
      FROM "User" u
      LEFT JOIN "Order" o ON o."userId" = u.id
        AND ($1::timestamptz IS NULL OR o."openedAt" >= $1)
        AND ($2::timestamptz IS NULL OR o."openedAt" < $2)
      GROUP BY u.id, u."fullName"
      ORDER BY total DESC
    `, gte ?? null, lt ?? null);
    return rows;
  }

  @Get('financial-summary')
  async financialSummary(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const gte = from ? new Date(from) : undefined;
    const lt = to ? new Date(to) : undefined;
    const [income, expense] = await Promise.all([
      this.prisma.$queryRawUnsafe<any[]>(`
        SELECT COALESCE(SUM(o.total),0) AS total FROM "Order" o
        WHERE ($1::timestamptz IS NULL OR o."openedAt" >= $1)
          AND ($2::timestamptz IS NULL OR o."openedAt" < $2)
      `, gte ?? null, lt ?? null),
      this.prisma.$queryRawUnsafe<any[]>(`
        SELECT COALESCE(SUM(e.amount),0) AS total FROM "Expense" e
        WHERE ($1::timestamptz IS NULL OR e."occurredAt" >= $1)
          AND ($2::timestamptz IS NULL OR e."occurredAt" < $2)
      `, gte ?? null, lt ?? null),
    ]);
    const inc = Number(income?.[0]?.total || 0);
    const exp = Number(expense?.[0]?.total || 0);
    return { income: inc, expense: exp, profit: inc - exp };
  }
}
