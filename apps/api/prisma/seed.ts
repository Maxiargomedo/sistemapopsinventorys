import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Seed default product types
  const comida = await (prisma as any).productType.upsert({ where: { name: 'Comida' }, update: {}, create: { name: 'Comida' } });
  await (prisma as any).productType.upsert({ where: { name: 'Bebidas' }, update: {}, create: { name: 'Bebidas' } });
  await (prisma as any).productType.upsert({ where: { name: 'Alcohol' }, update: {}, create: { name: 'Alcohol' } });
  const burger = await prisma.product.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
  id: '00000000-0000-0000-0000-000000000001',
      name: 'Hamburguesa Clásica',
      isSellable: true,
      ...( { type: { connect: { id: comida.id } } } as any),
      variants: { create: [{ name: 'Único', price: 3500 }] },
    },
  });
  const fries = await prisma.product.upsert({
    where: { id: '00000000-0000-0000-0000-000000000002' },
    update: {},
    create: {
  id: '00000000-0000-0000-0000-000000000002',
      name: 'Papas Fritas 150g',
      isSellable: true,
      ...( { type: { connect: { id: comida.id } } } as any),
      variants: { create: [{ name: 'Único', price: 1800 }] },
    },
  });
  console.log('Seeded:', burger.name, fries.name);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
