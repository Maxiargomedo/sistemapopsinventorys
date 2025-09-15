"use client";
import { useEffect, useMemo, useState } from "react";
import { formatCLP } from "@/lib/format";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/components/auth-context";
import { useRouter } from "next/navigation";

type Product = {
  id: string;
  name: string;
  imageUrl?: string;
  imageType?: string;
  variants: { id: string; name: string; price: number; quantity?: number }[];
  category?: { id: string; name: string } | null;
  type?: { id: string; name: string } | null;
};

type CartItem = {
  productId: string;
  variantId: string;
  name: string;
  variantName?: string;
  price: number;
  qty: number;
  note?: string;
  imageUrl?: string;
};

export default function POSPage() {
  const CHILE_TZ = 'America/Santiago';
  const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
  const { user, token, ready, fetchWithAuth } = useAuth() as any;
  const router = useRouter();
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Product | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);
  const [printData, setPrintData] = useState<null | {
    businessName: string;
    logoUrl?: string;
    order: any;
    items: CartItem[];
    total: number;
    tendered?: number;
    change?: number;
    payMethod?: string;
  }>(null);

  // Guard: requiere sesión para vender
  useEffect(() => {
    if (!ready) return;
    if (!user) router.replace('/login');
  }, [ready, user, router]);

  const { data: products, isLoading, error } = useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: async () => {
      const res = await fetch(`${api}/products`);
      if (!res.ok) throw new Error("Error al cargar productos");
      return res.json();
    },
  });
  const { data: types } = useQuery<{id:string; name:string}[]>({
    queryKey: ["product-types"],
    queryFn: async () => (await fetch(`${api}/product-types`)).json(),
  });
  const [activeTypeId, setActiveTypeId] = useState<string | null>(null);
  const [activeTypeName, setActiveTypeName] = useState<string | null>(null);


  const total = cart.reduce((acc, it) => acc + it.price * it.qty, 0);

  function openSheet(p: Product) {
    setSelected(p);
    setSheetOpen(true);
  }

  function addToCart(item: CartItem) {
    setCart(prev => {
      const idx = prev.findIndex(x => x.productId === item.productId && x.variantId === item.variantId && x.note === item.note);
      if (idx >= 0) {
        const clone = prev.slice();
        clone[idx] = { ...clone[idx], qty: clone[idx].qty + item.qty };
        return clone;
      }
      return [item, ...prev];
    });
    setSheetOpen(false);
  }

  const filteredByType = useMemo(() => {
    if (!Array.isArray(products)) return [] as Product[];
    if (!activeTypeId && !activeTypeName) return products;
    return products.filter(p =>
      (activeTypeId && p.type?.id === activeTypeId)
      || (activeTypeName && (p.type?.name === activeTypeName || p.category?.name === activeTypeName))
    );
  }, [products, activeTypeId, activeTypeName]);

  const filtered = useMemo(() => {
    const list = Array.isArray(filteredByType) ? filteredByType : [];
    if (!q.trim()) return list;
    const s = q.trim().toLowerCase();
    return list.filter(p => p.name.toLowerCase().includes(s) || p.category?.name?.toLowerCase().includes(s));
  }, [filteredByType, q]);

  return (
    <main className="relative pb-32">
      <div className="flex items-center justify-between gap-3">
        <h1>Punto de venta</h1>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar productos..."
          className="w-full max-w-md"
        />
      </div>

      {isLoading && <p className="mt-4">Cargando...</p>}
      {error && (
        <p className="mt-4 text-red-600">
          {(error as Error).message}. Asegura que la API esté corriendo.
        </p>
      )}

      <div className="mt-5 grid grid-cols-4 gap-4">
        {/* Sidebar de tipos */}
        <aside className="col-span-4 lg:col-span-1">
          <div className="card p-3 sticky top-4">
            <div className="font-medium mb-2">Tipos</div>
            <ul className="grid gap-1">
              <li>
                <button className={`w-full text-left px-3 py-2 rounded ${!activeTypeId ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-100'}`} onClick={()=>{ setActiveTypeId(null); setActiveTypeName(null); }}>Todos</button>
              </li>
              {(types || []).map(t => (
                <li key={t.id}>
                  <button className={`w-full text-left px-3 py-2 rounded ${activeTypeId===t.id ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-100'}`} onClick={()=>{ setActiveTypeId(t.id); setActiveTypeName(t.name); }}>{t.name}</button>
                </li>
              ))}
            </ul>
          </div>
        </aside>
        {/* Grid de productos */}
        <ul className="col-span-4 lg:col-span-3 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((p) => (
          <li key={p.id} className="card p-3 hover:shadow-md cursor-pointer transition-shadow" onClick={() => openSheet(p)}>
            {p.imageUrl ? (
              <img src={p.imageUrl} alt={p.name} className="w-full h-28 object-cover rounded" />
            ) : p.imageType ? (
              <img src={`${api}/products/${p.id}/image`} alt={p.name} className="w-full h-28 object-cover rounded" />
            ) : (
              <div className="w-full h-28 bg-gray-100 rounded" />
            )}
            <div className="mt-2 font-medium line-clamp-1" title={p.name}>{p.name}</div>
            {p.variants?.[0] && <div className="text-sm text-gray-600">Desde {formatCLP(p.variants[0].price)}</div>}
          </li>
        ))}
        </ul>
      </div>

      {/* Footer cart summary */}
      <div className="fixed right-4 bottom-4 left-4 md:left-auto md:w-[520px] rounded-lg border bg-white shadow-float p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="text-lg font-semibold">Total: {formatCLP(total)}</div>
          <div className="flex gap-2 items-center">
            <button className="secondary whitespace-nowrap" onClick={() => setSummaryOpen(true)}>Mostrar resumen de pedido</button>
            <button className="danger" disabled={!cart.length} onClick={() => setConfirmCancelOpen(true)}>Cancelar</button>
            <button className="primary" onClick={() => { setPayError(null); setPayOpen(true); }} disabled={!cart.length}>Pago</button>
          </div>
        </div>
        {notice && <div className="mt-2 text-sm text-green-700">{notice}</div>}
      </div>

      {/* Slide-in product sheet */}
      {sheetOpen && selected && (
        <ProductSheet product={selected} onClose={() => setSheetOpen(false)} onAdd={addToCart} />
      )}

      {/* Order summary modal */}
      {summaryOpen && (
        <OrderSummary cart={cart} onClose={() => setSummaryOpen(false)} onChange={setCart} />
      )}

      {/* Confirm cancel modal */}
      {confirmCancelOpen && (
        <ConfirmModal
          title="Cancelar pedido"
          message="¿Está seguro de cancelar el pedido actual? Esta acción limpiará el punto de venta."
          confirmLabel="Sí, cancelar"
          cancelLabel="No"
          onCancel={() => setConfirmCancelOpen(false)}
          onConfirm={() => {
            // Limpiar todo el estado del POS
            setCart([]);
            setSelected(null);
            setSheetOpen(false);
            setSummaryOpen(false);
            setPayOpen(false);
            setPayError(null);
            setOrderId(null);
            setNotice(null);
            setPrintData(null);
            setQ("");
            setConfirmCancelOpen(false);
          }}
        />
      )}

      {/* Payment modal */}
      {payOpen && (
        <PaymentModal
          total={total}
          error={payError || undefined}
          onClose={() => { setPayOpen(false); setPayError(null); }}
          onConfirm={async ({ method, tendered }) => {
            try {
              // Crear orden
              const items = cart.map((it) => ({
                productVariantId: it.variantId,
                description: `${it.name}${it.variantName ? ' · ' + it.variantName : ''}${it.note ? ' · ' + it.note : ''}`,
                qty: it.qty,
                unitPrice: it.price,
              }));
              const res = await fetchWithAuth(`${api}/orders`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items }) });
              if (!res.ok) {
                let msg = 'No se pudo crear la orden';
                try { const j = await res.json(); if (j?.message) msg = Array.isArray(j.message) ? j.message.join(', ') : j.message; } catch {}
                throw new Error(msg);
              }
              const order = await res.json();
              setOrderId(order.id);
              // Registrar pago
              const pay = await fetchWithAuth(`${api}/orders/${order.id}/payments`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ method: mapPayment(method), amount: total }) });
              if (!pay.ok) throw new Error('No se pudo registrar el pago');
              setCart([]);
              setPayOpen(false);
              setNotice(`Pago registrado. Orden #${order.number ?? ''}`);
              // Mostrar comprobante en la MISMA página y lanzar impresión
              const tender = typeof tendered === 'number' ? tendered : undefined;
              const change = typeof tender === 'number' ? Math.max(0, tender - total) : undefined;
              const data = { businessName: 'Fonda Los Socios', logoUrl: '', order, items: cart, total, tendered: tender, change, payMethod: method };
              setPrintData(data);
              // Esperar a que exista el nodo de recibo en el DOM antes de imprimir
              const ensureAndPrint = (attempt = 0) => {
                if (typeof window === 'undefined') return;
                const el = document.querySelector('.print-area');
                if (el || attempt >= 15) {
                  window.print();
                } else {
                  setTimeout(() => ensureAndPrint(attempt + 1), 100);
                }
              };
              setTimeout(() => ensureAndPrint(0), 50);
            } catch (e: any) {
              if (String(e?.message || '').includes('401') || String(e).includes('Unauthorized')) {
                setNotice('Sesión expirada. Por favor inicia sesión de nuevo.');
                router.replace('/login');
              } else {
                // Mostrar error de stock dentro del modal de Pago
                setPayError(e.message ?? 'Operación fallida');
              }
            }
          }}
        />
      )}
      {printData && (
        <ReceiptOverlay data={printData} onClose={() => setPrintData(null)} cashierName={user?.fullName} />
      )}
    </main>
  );
}

function ProductSheet({ product, onClose, onAdd }: { product: Product; onClose: () => void; onAdd: (item: CartItem) => void }) {
  const [variantId, setVariantId] = useState(product.variants?.[0]?.id || "");
  const [note, setNote] = useState("");
  const [qty, setQty] = useState(1);
  const variant = product.variants.find(v => v.id === variantId) || product.variants[0];
  const price = variant?.price ?? 0;
  const subtotal = price * qty;

  return (
    <div className="fixed inset-0 z-30">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="absolute inset-y-0 right-0 w-full sm:w-[28rem] bg-white shadow-2xl animate-[slideIn_.25s_ease-out_forwards]">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold">{product.name}</h2>
          <button onClick={onClose} className="text-sm text-gray-600">Cerrar</button>
        </div>
        <div className="p-4 grid gap-3">
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.name} className="w-full h-40 object-cover rounded" />
          ) : product.imageType ? (
            <img src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/products/${product.id}/image`} alt={product.name} className="w-full h-40 object-cover rounded" />
          ) : (
            <div className="w-full h-40 bg-gray-100 rounded" />
          )}
          {product.variants.length > 1 && (
            <div>
              <label className="block text-sm mb-1">Tamaño</label>
              <select className="border rounded p-2 w-full" value={variantId} onChange={(e)=>setVariantId(e.target.value)}>
                {product.variants.map(v => (
                  <option key={v.id} value={v.id}>{v.name} · {formatCLP(v.price)}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm mb-1">Observación</label>
            <textarea className="border rounded p-2 w-full" rows={2} value={note} onChange={(e)=>setNote(e.target.value)} placeholder="Escribe detalles de preparación..." />
          </div>
          <div className="grid grid-cols-2 gap-3 items-end">
            <div>
              <label className="block text-sm mb-1">Precio</label>
              <div className="font-medium">{formatCLP(price)}</div>
            </div>
            <div>
              <label className="block text-sm mb-1">Cantidad</label>
              <div className="flex items-center border rounded overflow-hidden w-36">
                <button className="px-3 py-2" onClick={()=>setQty(q=>Math.max(1, q-1))}>-</button>
                <input className="w-full text-center outline-none" type="number" value={qty} onChange={(e)=>setQty(Math.max(1, Number(e.target.value||1)))} />
                <button className="px-3 py-2" onClick={()=>setQty(q=>q+1)}>+</button>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between mt-2">
            <div className="text-lg font-semibold">Total: {formatCLP(subtotal)}</div>
            <button
              className="px-4 py-2 rounded bg-blue-600 text-white"
              onClick={() => onAdd({
                productId: product.id,
                variantId: variant?.id || product.variants[0]?.id,
                name: product.name,
                variantName: variant?.name,
                price: price,
                qty,
                note: note || undefined,
                imageUrl: product.imageUrl,
              })}
            >
              Agregar
            </button>
          </div>
        </div>
      </div>
      <style jsx>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: .9; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

function OrderSummary({ cart, onClose, onChange }: { cart: CartItem[]; onClose: () => void; onChange: (items: CartItem[]) => void }) {
  const total = cart.reduce((acc, it) => acc + it.price * it.qty, 0);
  function inc(i: number) { onChange(cart.map((x,idx)=> idx===i ? { ...x, qty: x.qty + 1 } : x)); }
  function dec(i: number) { onChange(cart.map((x,idx)=> idx===i ? { ...x, qty: Math.max(1, x.qty - 1) } : x)); }
  function rm(i: number) { onChange(cart.filter((_,idx)=> idx!==i)); }
  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="absolute inset-x-0 bottom-0 bg-white rounded-t-2xl shadow-2xl p-4 max-h-[80vh] overflow-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Resumen de pedido</h3>
          <button onClick={onClose} className="text-sm text-gray-600">Cerrar</button>
        </div>
        <ul className="mt-3 grid gap-2">
          {cart.map((it, i) => (
            <li key={i} className="flex items-center justify-between border rounded p-3">
              <div>
                <div className="font-medium">{it.name}{it.variantName ? ` · ${it.variantName}` : ''}</div>
                {it.note && <div className="text-xs text-gray-600">Obs: {it.note}</div>}
                <div className="text-sm text-gray-600">{formatCLP(it.price)} c/u</div>
              </div>
              <div className="flex items-center gap-2">
                <button className="px-2 py-1 border rounded" onClick={()=>dec(i)}>-</button>
                <span>{it.qty}</span>
                <button className="px-2 py-1 border rounded" onClick={()=>inc(i)}>+</button>
                <div className="w-20 text-right font-medium">{formatCLP(it.price*it.qty)}</div>
                <button className="px-2 py-1 text-red-600" onClick={()=>rm(i)}>Eliminar</button>
              </div>
            </li>
          ))}
        </ul>
  <div className="mt-3 text-right text-lg font-semibold">Total: {formatCLP(total)}</div>
      </div>
    </div>
  );
}

function PaymentModal({ total, onClose, onConfirm, error }: { total: number; onClose: () => void; onConfirm: (payload: { method: string; tendered?: number }) => void | Promise<void>; error?: string }) {
  const [method, setMethod] = useState("efectivo");
  const [submitting, setSubmitting] = useState(false);
  const [tendered, setTendered] = useState<string>("");
  const tender = Number(tendered || 0);
  const change = method === 'efectivo' ? Math.max(0, tender - total) : 0;
  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="absolute inset-x-0 bottom-0 bg-white rounded-t-2xl shadow-2xl p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Pago</h3>
          <button onClick={onClose} className="text-sm text-gray-600">Cerrar</button>
        </div>
  <div className="mt-3">Total a pagar: <span className="font-semibold">{formatCLP(total)}</span></div>
        <div className="mt-3">
          <label className="block text-sm mb-1">Método de pago</label>
          <select className="border rounded p-2" value={method} onChange={(e)=>setMethod(e.target.value)}>
            <option value="efectivo">Efectivo</option>
            <option value="debito">Tarjeta débito</option>
            <option value="credito">Tarjeta crédito</option>
            <option value="transferencia">Transferencia bancaria</option>
          </select>
        </div>
        {method === 'efectivo' && (
          <div className="mt-3">
            <label className="block text-sm mb-1">Efectivo recibido</label>
            <input className="border rounded p-2 w-full" type="number" min="0" step="0.01" placeholder="0" value={tendered} onChange={(e)=>{ setTendered(e.target.value); }} />
            {tender < total ? (
              <div className="mt-1 text-sm text-red-700">{`Falta ${formatCLP(total - tender)}`}</div>
            ) : (
              <div className="mt-1 text-lg font-semibold text-green-700">{`Cambio: ${formatCLP(change)}`}</div>
            )}
          </div>
        )}
        {error && <div className="mt-3 text-sm text-red-700">{error}</div>}
        <div className="mt-4 text-right">
          <button className="px-4 py-2 rounded bg-green-600 text-white disabled:opacity-60" disabled={submitting || (method === 'efectivo' && tender < total)} onClick={async ()=>{ setSubmitting(true); try { await onConfirm({ method, tendered: method === 'efectivo' ? tender : undefined }); } finally { setSubmitting(false); }}}>Confirmar pago</button>
        </div>
      </div>
    </div>
  );
}

function mapPayment(m: string): 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA' | 'OTRO' {
  switch (m) {
    case 'efectivo': return 'EFECTIVO';
    case 'debito':
    case 'credito': return 'TARJETA';
    case 'transferencia': return 'TRANSFERENCIA';
    default: return 'OTRO';
  }
}

function ReceiptOverlay({ data, onClose, cashierName }: { data: { businessName: string; logoUrl?: string; order: any; items: CartItem[]; total: number; tendered?: number; change?: number; payMethod?: string }; onClose: () => void; cashierName?: string }) {
  // Capturar afterprint para cerrar automáticamente si se desea
  useEffect(() => {
    const handler = () => { onClose(); };
    if (typeof window !== 'undefined') {
      window.addEventListener('afterprint', handler);
    }
    return () => {
      if (typeof window !== 'undefined') window.removeEventListener('afterprint', handler);
    };
  }, [onClose]);

  const issuedAt = new Date();
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
      {/* Vista previa en pantalla (no se imprime por defecto) */}
      <div className="bg-white rounded shadow-lg p-3 w-[360px] max-h-[90vh] overflow-auto no-print">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">Comprobante</h3>
          <button className="text-sm text-gray-600" onClick={onClose}>Cerrar</button>
        </div>
        <ReceiptContent id="print-receipt" data={data} cashierName={cashierName} issuedAt={issuedAt} />
        <div className="mt-3 flex justify-end gap-2">
          <button className="px-3 py-1 rounded border" onClick={onClose}>Cerrar</button>
          <button className="px-3 py-1 rounded bg-black text-white" onClick={() => window.print()}>Imprimir</button>
        </div>
      </div>

      {/* Área exclusiva para impresión (mismo contenido). Oculta en pantalla, visible solo en print via CSS global */}
        <div className="only-print">
        <ReceiptContent id="print-receipt" data={data} cashierName={cashierName} issuedAt={issuedAt} />
      </div>
    </div>
  );
}

function ReceiptContent({ id, data, cashierName, issuedAt }: { id: string; data: { businessName: string; logoUrl?: string; order: any; items: CartItem[]; total: number; tendered?: number; change?: number; payMethod?: string }; cashierName?: string; issuedAt: Date; }) {
  const { businessName, logoUrl, order, items, total, tendered, change, payMethod } = data;
  return (
    <div id={id} className="print-area">
      <div style={{ textAlign: 'center' }}>
        {logoUrl ? <img src={logoUrl} style={{ maxHeight: 60, objectFit: 'contain', margin: '0 auto' }} alt="logo" /> : null}
        <h1 style={{ fontSize: 16, margin: '4px 0' }}>{businessName}</h1>
        <div className="muted">Comprobante de venta</div>
      </div>
      <div className="muted" style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
  <span>Fecha: {issuedAt.toLocaleString('es-CL', { timeZone: 'America/Santiago', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}</span>
        {cashierName ? <span>Cajero: {cashierName}</span> : null}
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8 }}>
        <thead>
          <tr>
            <td>Producto</td>
            <td style={{ textAlign: 'center' }}>Cant</td>
            <td style={{ textAlign: 'right' }}>Total</td>
          </tr>
        </thead>
        <tbody>
          {items.map((it, idx) => (
            <tr key={idx}>
              <td style={{ padding: '4px 0', borderBottom: '1px dashed #ddd', fontSize: 13 }}>
                {it.name}{it.variantName ? ` · ${it.variantName}` : ''}{it.note ? ` · ${it.note}` : ''}
              </td>
              <td style={{ padding: '4px 0', borderBottom: '1px dashed #ddd', fontSize: 13, textAlign: 'center' }}>{it.qty}</td>
              <td style={{ padding: '4px 0', borderBottom: '1px dashed #ddd', fontSize: 13, textAlign: 'right' }}>{formatCLP(it.price * it.qty)}</td>
            </tr>
          ))}
        </tbody>
      </table>
  <div style={{ textAlign: 'right', marginTop: 8, fontWeight: 'bold' }}>Total: {formatCLP(total)}</div>
      {(typeof tendered === 'number') && (
        <div style={{ marginTop: 6, fontSize: 13 }}>
          <div>Pago: {payMethod?.toUpperCase?.() || 'EFECTIVO'} · Recibido: {formatCLP(tendered)}</div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>Cambio: {formatCLP(Number(change || 0))}</div>
        </div>
      )}
      <div style={{ textAlign: 'center', marginTop: 12 }}>¡Gracias por su compra!</div>
      {/* QR: pendiente para agregar cuando se entregue la imagen */}
    </div>
  );
}

function ConfirmModal({ title, message, confirmLabel = 'Confirmar', cancelLabel = 'Cancelar', onConfirm, onCancel }: { title: string; message: string; confirmLabel?: string; cancelLabel?: string; onConfirm: () => void; onCancel: () => void; }) {
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="absolute inset-x-0 bottom-0 sm:inset-0 sm:flex sm:items-center sm:justify-center">
        <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-2xl p-4 w-full sm:w-[420px]">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">{title}</h3>
            <button className="text-sm text-gray-600" onClick={onCancel}>Cerrar</button>
          </div>
          <div className="mt-2 text-sm text-gray-800">{message}</div>
          <div className="mt-4 flex justify-end gap-2">
            <button className="px-3 py-2 rounded border" onClick={onCancel}>{cancelLabel}</button>
            <button className="px-3 py-2 rounded bg-red-600 text-white" onClick={onConfirm}>{confirmLabel}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
