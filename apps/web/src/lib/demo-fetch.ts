/* ─────────────────────────────────────────────────────────
   Demo-mode fetch interceptor.
   Matches API URL patterns and returns mock responses so
   the frontend works without a real backend (e.g. Netlify).
   ───────────────────────────────────────────────────────── */

import {
  demoUsers,
  demoProducts,
  demoCategories,
  demoProductTypes,
  demoSettings,
  getDemoOrders,
  getDemoInvoices,
  demoCreateOrder,
  demoAddPayment,
  demoTopProducts,
  demoSalesByHour,
  demoInventoryValuation,
  demoEmployeesSales,
  demoFinancialSummary,
} from "./demo-data";

export const DEMO_MODE =
  !process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_DEMO_MODE === "true";

// ── helpers ──────────────────────────────────────────────
function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function text(data: string, status = 200): Response {
  return new Response(data, { status });
}

/** Parse JSON body from a RequestInit */
async function bodyJSON(init?: RequestInit): Promise<any> {
  if (!init?.body) return {};
  if (typeof init.body === "string") return JSON.parse(init.body);
  return {};
}

// ── Route matcher ────────────────────────────────────────
/**
 * Drop the origin and return only the pathname + search.
 * Works for both full URLs and relative paths.
 */
function pathname(input: RequestInfo): string {
  const url = typeof input === "string" ? input : input.url;
  try {
    const u = new URL(url);
    return u.pathname + u.search;
  } catch {
    return url;
  }
}

// ── Main interceptor ─────────────────────────────────────
export async function demoFetch(
  input: RequestInfo,
  init?: RequestInit
): Promise<Response> {
  const path = pathname(input);
  const method = (init?.method || "GET").toUpperCase();

  // ── Auth ────────────────────────────────────────────
  if (path === "/auth/login" && method === "POST") {
    const body = await bodyJSON(init);
    const user = demoUsers.find(
      (u) => u.email === body.email && u.password === body.password
    );
    if (!user)
      return json({ message: "Credenciales inválidas" }, 401);
    const { password: _, ...safe } = user;
    return json({ access_token: "demo-jwt-token", user: safe });
  }

  if (path === "/auth/register" && method === "POST") {
    const body = await bodyJSON(init);
    return json({ user: { id: "u-new", email: body.email, fullName: body.fullName, role: "VENDEDOR" } }, 201);
  }

  // ── Products ────────────────────────────────────────
  if (/^\/products\/?$/.test(path.split("?")[0]) && method === "GET") {
    const qs = path.includes("?") ? new URLSearchParams(path.split("?")[1]) : null;
    let list = demoProducts;
    if (qs?.get("typeId")) {
      list = list.filter((p) => p.type?.id === qs.get("typeId"));
    }
    return json(list);
  }

  if (/^\/products\/[^/]+\/image/.test(path) && method === "GET") {
    // no stored images in demo
    return new Response(null, { status: 404 });
  }

  if (/^\/products\/[^/]+$/.test(path.split("?")[0]) && method === "GET") {
    const id = path.split("/products/")[1]?.split("?")[0];
    const product = demoProducts.find((p) => p.id === id);
    return product ? json(product) : json({ message: "Not found" }, 404);
  }

  if (/^\/products\/?$/.test(path.split("?")[0]) && method === "POST") {
    return json({ message: "Producto creado (demo)" }, 201);
  }

  if (/^\/products\/[^/]+$/.test(path.split("?")[0]) && method === "PATCH") {
    return json({ message: "Producto actualizado (demo)" });
  }

  if (/^\/products\/[^/]+$/.test(path.split("?")[0]) && method === "DELETE") {
    return json({ message: "Producto eliminado (demo)" });
  }

  // ── Product Types ───────────────────────────────────
  if (/^\/product-types\/?$/.test(path.split("?")[0]) && method === "GET") {
    return json(demoProductTypes);
  }

  // ── Categories ──────────────────────────────────────
  if (/^\/categories\/?$/.test(path.split("?")[0]) && method === "GET") {
    return json(demoCategories);
  }

  // ── Orders ──────────────────────────────────────────
  if (/^\/orders\/?$/.test(path.split("?")[0]) && method === "GET") {
    const orders = getDemoOrders();
    return json(orders);
  }

  if (/^\/orders\/?$/.test(path.split("?")[0]) && method === "POST") {
    const body = await bodyJSON(init);
    const order = demoCreateOrder(body);
    return json(order, 201);
  }

  if (/^\/orders\/[^/]+\/payments/.test(path) && method === "POST") {
    const orderId = path.split("/orders/")[1]?.split("/")[0];
    const body = await bodyJSON(init);
    const payment = demoAddPayment(orderId, body);
    return payment ? json(payment, 201) : json({ message: "Order not found" }, 404);
  }

  if (/^\/orders\/[^/]+$/.test(path.split("?")[0]) && method === "GET") {
    const id = path.split("/orders/")[1]?.split("?")[0];
    const orders = getDemoOrders();
    const order = orders.find((o: any) => o.id === id);
    return order ? json(order) : json({ message: "Not found" }, 404);
  }

  // ── Reports ─────────────────────────────────────────
  if (path.startsWith("/reports/top-products")) return json(demoTopProducts());
  if (path.startsWith("/reports/sales-by-hour")) return json(demoSalesByHour());
  if (path.startsWith("/reports/inventory-valuation")) return json(demoInventoryValuation());
  if (path.startsWith("/reports/employees-sales")) return json(demoEmployeesSales());
  if (path.startsWith("/reports/financial-summary")) return json(demoFinancialSummary());
  if (path.startsWith("/reports/low-rotation")) return json([]);

  // ── Invoices ────────────────────────────────────────
  if (/^\/invoices\/?$/.test(path.split("?")[0]) && method === "GET") {
    return json(getDemoInvoices());
  }
  if (/^\/invoices\/?$/.test(path.split("?")[0]) && method === "POST") {
    return json({ message: "Factura guardada (demo)" }, 201);
  }
  if (/^\/invoices\/[^/]+\/file/.test(path)) {
    return new Response(null, { status: 404 });
  }

  // ── Settings ────────────────────────────────────────
  if (path.startsWith("/settings") && method === "GET") return json(demoSettings);
  if (path.startsWith("/settings") && method === "PUT") return json(demoSettings);

  // ── Users ───────────────────────────────────────────
  if (/^\/users\/?$/.test(path.split("?")[0]) && method === "GET") {
    return json(demoUsers.map(({ password: _, ...u }) => u));
  }
  if (/^\/users\/?$/.test(path.split("?")[0]) && method === "POST") {
    return json({ message: "Usuario creado (demo)" }, 201);
  }
  if (/^\/users\/[^/]+$/.test(path.split("?")[0]) && (method === "PATCH" || method === "DELETE")) {
    return json({ message: "OK (demo)" });
  }

  // ── Health ──────────────────────────────────────────
  if (path.startsWith("/health")) return json({ status: "ok (demo)" });

  // ── Fallback ────────────────────────────────────────
  return json({ message: `Demo: ruta no implementada (${method} ${path})` }, 200);
}
