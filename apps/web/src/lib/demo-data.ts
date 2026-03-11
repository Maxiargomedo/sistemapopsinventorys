/* ─────────────────────────────────────────────────────────
   Demo data – used when the app runs without a real backend
   (e.g. Netlify portfolio deployment).
   ───────────────────────────────────────────────────────── */

// ── helpers ──────────────────────────────────────────────
let _orderSeq = 1;
function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// ── Users ───────────────────────────────────────────────
export interface DemoUser {
  id: string;
  email: string;
  password: string;
  fullName: string;
  role: "ADMIN" | "VENDEDOR" | "JEFE_LOCAL";
  isActive: boolean;
}

export const demoUsers: DemoUser[] = [
  {
    id: "u1",
    email: "admin@demo.com",
    password: "demo1234",
    fullName: "Admin Demo",
    role: "ADMIN",
    isActive: true,
  },
  {
    id: "u2",
    email: "vendedor@demo.com",
    password: "demo1234",
    fullName: "Vendedor Demo",
    role: "VENDEDOR",
    isActive: true,
  },
  {
    id: "u3",
    email: "jefe@demo.com",
    password: "demo1234",
    fullName: "Jefe Local Demo",
    role: "JEFE_LOCAL",
    isActive: true,
  },
];

// ── Categories ──────────────────────────────────────────
export const demoCategories = [
  { id: "cat1", name: "Comida Rápida" },
  { id: "cat2", name: "Bebidas" },
  { id: "cat3", name: "Postres" },
  { id: "cat4", name: "Snacks" },
];

// ── Product Types ───────────────────────────────────────
export const demoProductTypes = [
  { id: "pt1", name: "Hamburguesas" },
  { id: "pt2", name: "Papas Fritas" },
  { id: "pt3", name: "Bebidas" },
  { id: "pt4", name: "Helados" },
  { id: "pt5", name: "Completos" },
];

// ── Products ────────────────────────────────────────────
export interface DemoVariant {
  id: string;
  name: string;
  price: number;
  cost: number;
  quantity: number;
  active: boolean;
}

export interface DemoProduct {
  id: string;
  name: string;
  description: string;
  isSellable: boolean;
  isStockItem: boolean;
  imageUrl: string;
  category: { id: string; name: string } | null;
  type: { id: string; name: string } | null;
  variants: DemoVariant[];
}

export const demoProducts: DemoProduct[] = [
  {
    id: "p1",
    name: "Hamburguesa Clásica",
    description: "Carne de vacuno, lechuga, tomate, queso y salsa especial",
    isSellable: true,
    isStockItem: true,
    imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&h=200&fit=crop",
    category: demoCategories[0],
    type: demoProductTypes[0],
    variants: [
      { id: "v1a", name: "Simple", price: 3500, cost: 1500, quantity: 50, active: true },
      { id: "v1b", name: "Doble", price: 5000, cost: 2200, quantity: 30, active: true },
    ],
  },
  {
    id: "p2",
    name: "Hamburguesa de Pollo",
    description: "Pechuga de pollo crispy, lechuga, mayo y pepinillos",
    isSellable: true,
    isStockItem: true,
    imageUrl: "https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=200&h=200&fit=crop",
    category: demoCategories[0],
    type: demoProductTypes[0],
    variants: [
      { id: "v2a", name: "Simple", price: 3800, cost: 1600, quantity: 40, active: true },
      { id: "v2b", name: "Doble", price: 5500, cost: 2500, quantity: 25, active: true },
    ],
  },
  {
    id: "p3",
    name: "Papas Fritas",
    description: "Papas fritas crujientes con sal",
    isSellable: true,
    isStockItem: true,
    imageUrl: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=200&h=200&fit=crop",
    category: demoCategories[3],
    type: demoProductTypes[1],
    variants: [
      { id: "v3a", name: "Regular", price: 1500, cost: 500, quantity: 100, active: true },
      { id: "v3b", name: "Grande", price: 2500, cost: 800, quantity: 60, active: true },
    ],
  },
  {
    id: "p4",
    name: "Coca-Cola",
    description: "Bebida gaseosa Coca-Cola",
    isSellable: true,
    isStockItem: true,
    imageUrl: "https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=200&h=200&fit=crop",
    category: demoCategories[1],
    type: demoProductTypes[2],
    variants: [
      { id: "v4a", name: "350ml", price: 1000, cost: 400, quantity: 80, active: true },
      { id: "v4b", name: "500ml", price: 1500, cost: 550, quantity: 60, active: true },
      { id: "v4c", name: "1L", price: 2000, cost: 750, quantity: 30, active: true },
    ],
  },
  {
    id: "p5",
    name: "Jugo Natural",
    description: "Jugo de naranja recién exprimido",
    isSellable: true,
    isStockItem: true,
    imageUrl: "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=200&h=200&fit=crop",
    category: demoCategories[1],
    type: demoProductTypes[2],
    variants: [
      { id: "v5a", name: "Regular", price: 1800, cost: 700, quantity: 45, active: true },
    ],
  },
  {
    id: "p6",
    name: "Helado de Vainilla",
    description: "Helado artesanal de vainilla",
    isSellable: true,
    isStockItem: true,
    imageUrl: "https://images.unsplash.com/photo-1570197571499-166b36435e9f?w=200&h=200&fit=crop",
    category: demoCategories[2],
    type: demoProductTypes[3],
    variants: [
      { id: "v6a", name: "1 Bola", price: 1500, cost: 500, quantity: 70, active: true },
      { id: "v6b", name: "2 Bolas", price: 2500, cost: 900, quantity: 50, active: true },
    ],
  },
  {
    id: "p7",
    name: "Completo Italiano",
    description: "Pan, vienesa, tomate, palta y mayo",
    isSellable: true,
    isStockItem: true,
    imageUrl: "https://images.unsplash.com/photo-1619740455993-9d701c8b34c6?w=200&h=200&fit=crop",
    category: demoCategories[0],
    type: demoProductTypes[4],
    variants: [
      { id: "v7a", name: "Regular", price: 2500, cost: 900, quantity: 55, active: true },
    ],
  },
  {
    id: "p8",
    name: "Hot Dog Americano",
    description: "Pan, vienesa, kétchup y mostaza",
    isSellable: true,
    isStockItem: true,
    imageUrl: "https://images.unsplash.com/photo-1612392062126-2f878bfa8695?w=200&h=200&fit=crop",
    category: demoCategories[0],
    type: demoProductTypes[4],
    variants: [
      { id: "v8a", name: "Simple", price: 2000, cost: 700, quantity: 65, active: true },
    ],
  },
  {
    id: "p9",
    name: "Helado de Chocolate",
    description: "Helado artesanal de chocolate belga",
    isSellable: true,
    isStockItem: true,
    imageUrl: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=200&h=200&fit=crop",
    category: demoCategories[2],
    type: demoProductTypes[3],
    variants: [
      { id: "v9a", name: "1 Bola", price: 1500, cost: 500, quantity: 60, active: true },
      { id: "v9b", name: "2 Bolas", price: 2500, cost: 900, quantity: 40, active: true },
    ],
  },
  {
    id: "p10",
    name: "Agua Mineral",
    description: "Agua mineral sin gas",
    isSellable: true,
    isStockItem: true,
    imageUrl: "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=200&h=200&fit=crop",
    category: demoCategories[1],
    type: demoProductTypes[2],
    variants: [
      { id: "v10a", name: "500ml", price: 800, cost: 300, quantity: 100, active: true },
      { id: "v10b", name: "1.5L", price: 1200, cost: 450, quantity: 50, active: true },
    ],
  },
];

// ── Orders (sample) ─────────────────────────────────────
function makeDate(hoursAgo: number) {
  return new Date(Date.now() - hoursAgo * 3600_000).toISOString();
}

export function getDemoOrders() {
  const stored = _readLocal<any[]>("demo_orders");
  if (stored && stored.length) return stored;
  const seed = [
    {
      id: "o1",
      number: 1,
      channel: "SALON",
      status: "CLOSED",
      openedAt: makeDate(3),
      subtotal: 8500,
      tax: 0,
      tip: 0,
      discount: 0,
      total: 8500,
      userId: "u1",
      items: [
        { id: "oi1", description: "Hamburguesa Clásica · Simple", qty: 1, unitPrice: 3500, discount: 0, total: 3500, productVariantId: "v1a" },
        { id: "oi2", description: "Hamburguesa Clásica · Doble", qty: 1, unitPrice: 5000, discount: 0, total: 5000, productVariantId: "v1b" },
      ],
      payments: [{ id: "pay1", method: "EFECTIVO", amount: 8500 }],
    },
    {
      id: "o2",
      number: 2,
      channel: "PARA_LLEVAR",
      status: "CLOSED",
      openedAt: makeDate(2),
      subtotal: 5800,
      tax: 0,
      tip: 0,
      discount: 0,
      total: 5800,
      userId: "u2",
      items: [
        { id: "oi3", description: "Completo Italiano · Regular", qty: 2, unitPrice: 2500, discount: 0, total: 5000, productVariantId: "v7a" },
        { id: "oi4", description: "Agua Mineral · 500ml", qty: 1, unitPrice: 800, discount: 0, total: 800, productVariantId: "v10a" },
      ],
      payments: [{ id: "pay2", method: "TARJETA", amount: 5800 }],
    },
    {
      id: "o3",
      number: 3,
      channel: "SALON",
      status: "CLOSED",
      openedAt: makeDate(1),
      subtotal: 6500,
      tax: 0,
      tip: 500,
      discount: 0,
      total: 7000,
      userId: "u1",
      items: [
        { id: "oi5", description: "Hamburguesa de Pollo · Simple", qty: 1, unitPrice: 3800, discount: 0, total: 3800, productVariantId: "v2a" },
        { id: "oi6", description: "Papas Fritas · Regular", qty: 1, unitPrice: 1500, discount: 0, total: 1500, productVariantId: "v3a" },
        { id: "oi7", description: "Coca-Cola · 500ml", qty: 1, unitPrice: 1500, discount: 0, total: 1500, productVariantId: "v4b" },
      ],
      payments: [{ id: "pay3", method: "EFECTIVO", amount: 7000 }],
    },
  ];
  _writeLocal("demo_orders", seed);
  _orderSeq = seed.length + 1;
  return seed;
}

// ── Settings ────────────────────────────────────────────
export const demoSettings = {
  id: "default",
  companyName: "Pop's Inventory Demo",
  rut: "12.345.678-9",
  phone: "+56 9 1234 5678",
  email: "contacto@popsinventory.demo",
  taxRate: 19,
  currency: "CLP",
};

// ── Reports helpers ─────────────────────────────────────
export function demoTopProducts() {
  return [
    { id: "p1", name: "Hamburguesa Clásica", qty: 42, total: 182000 },
    { id: "p7", name: "Completo Italiano", qty: 38, total: 95000 },
    { id: "p3", name: "Papas Fritas", qty: 35, total: 62500 },
    { id: "p4", name: "Coca-Cola", qty: 30, total: 37500 },
    { id: "p2", name: "Hamburguesa de Pollo", qty: 25, total: 95000 },
    { id: "p8", name: "Hot Dog Americano", qty: 22, total: 44000 },
    { id: "p6", name: "Helado de Vainilla", qty: 18, total: 33000 },
    { id: "p5", name: "Jugo Natural", qty: 15, total: 27000 },
    { id: "p9", name: "Helado de Chocolate", qty: 12, total: 22500 },
    { id: "p10", name: "Agua Mineral", qty: 10, total: 8000 },
  ];
}

export function demoSalesByHour() {
  return [
    { hour: 10, orders: 3, total: 12500 },
    { hour: 11, orders: 5, total: 22000 },
    { hour: 12, orders: 12, total: 58000 },
    { hour: 13, orders: 15, total: 78000 },
    { hour: 14, orders: 8, total: 36000 },
    { hour: 15, orders: 4, total: 18000 },
    { hour: 16, orders: 3, total: 14500 },
    { hour: 17, orders: 6, total: 28000 },
    { hour: 18, orders: 10, total: 52000 },
    { hour: 19, orders: 14, total: 72000 },
    { hour: 20, orders: 11, total: 55000 },
    { hour: 21, orders: 7, total: 32000 },
  ];
}

export function demoInventoryValuation() {
  const items = demoProducts.flatMap((p) =>
    p.variants.map((v) => ({
      variant_id: v.id,
      product_name: p.name,
      variant_name: v.name,
      name: p.name,
      quantity: v.quantity,
      cost: v.cost,
      value: v.quantity * v.cost,
    }))
  );
  const total = items.reduce((a, i) => a + i.value, 0);
  return { items, total };
}

export function demoEmployeesSales() {
  return [
    { id: "u1", name: "Admin Demo", orders: 28, total: 245000 },
    { id: "u2", name: "Vendedor Demo", orders: 22, total: 178000 },
    { id: "u3", name: "Jefe Local Demo", orders: 15, total: 125000 },
  ];
}

export function demoFinancialSummary() {
  return { income: 548000, expense: 195000, profit: 353000 };
}

// ── Local-storage helpers for demo persistence ──────────
function _readLocal<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function _writeLocal(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

// ── Create order (POS) ─────────────────────────────────
export function demoCreateOrder(body: {
  items: { variantId: string; qty: number; note?: string }[];
  tip?: number;
  discount?: number;
}) {
  const orders = getDemoOrders();
  const seq = orders.length + 1;
  const lineItems = body.items.map((it) => {
    // find variant across all products
    for (const p of demoProducts) {
      const v = p.variants.find((vr) => vr.id === it.variantId);
      if (v) {
        return {
          id: uid(),
          description: `${p.name} · ${v.name}`,
          qty: it.qty,
          unitPrice: v.price,
          discount: 0,
          total: v.price * it.qty,
          productVariantId: v.id,
        };
      }
    }
    return { id: uid(), description: "Producto", qty: it.qty, unitPrice: 0, discount: 0, total: 0, productVariantId: it.variantId };
  });
  const subtotal = lineItems.reduce((a, li) => a + li.total, 0);
  const order = {
    id: uid(),
    number: seq,
    channel: "SALON",
    status: "OPEN",
    openedAt: new Date().toISOString(),
    subtotal,
    tax: 0,
    tip: body.tip || 0,
    discount: body.discount || 0,
    total: subtotal + (body.tip || 0) - (body.discount || 0),
    userId: "u1",
    items: lineItems,
    payments: [] as { id: string; method: string; amount: number }[],
  };
  orders.push(order);
  _writeLocal("demo_orders", orders);
  return order;
}

// ── Add payment ─────────────────────────────────────────
export function demoAddPayment(orderId: string, body: { method: string; amount: number }) {
  const orders = getDemoOrders();
  const order = orders.find((o) => o.id === orderId);
  if (!order) return null;
  const payment = { id: uid(), method: body.method, amount: body.amount };
  order.payments.push(payment);
  order.status = "CLOSED";
  _writeLocal("demo_orders", orders);
  return payment;
}

// ── Invoices (purchase) ─────────────────────────────────
export function getDemoInvoices() {
  const stored = _readLocal<any[]>("demo_invoices");
  if (stored) return stored;
  const seed = [
    {
      id: "inv1",
      invoiceNumber: "F-001234",
      companyName: "Distribuidora Central",
      invoiceDate: new Date(Date.now() - 7 * 86400_000).toISOString(),
      uploadedAt: new Date(Date.now() - 7 * 86400_000).toISOString(),
      total: 150000,
      fileName: "factura-F-001234.pdf",
    },
    {
      id: "inv2",
      invoiceNumber: "F-005678",
      companyName: "Proveedora del Sur",
      invoiceDate: new Date(Date.now() - 3 * 86400_000).toISOString(),
      uploadedAt: new Date(Date.now() - 3 * 86400_000).toISOString(),
      total: 85000,
      fileName: "factura-F-005678.pdf",
    },
  ];
  _writeLocal("demo_invoices", seed);
  return seed;
}
