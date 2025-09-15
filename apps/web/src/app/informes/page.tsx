"use client";
import { useEffect, useMemo, useState } from "react";
import { formatCLP } from "@/lib/format";
import { useAuth } from "@/components/auth-context";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const CHILE_TZ = "America/Santiago";

function todayYMDInTZ(tz: string) {
  // en-CA yields YYYY-MM-DD format
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

export default function InformesPage() {
  const { user, ready, fetchWithAuth } = useAuth();
  const [view, setView] = useState<'menu' | 'ventas-dia' | 'top-products' | 'inventory-valuation' | 'employees-sales' | 'sales-by-hour' | 'financial-summary'>('menu');
  const [date, setDate] = useState(() => todayYMDInTZ(CHILE_TZ));
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // States for other reports
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [limit, setLimit] = useState<string>("10");
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [valuation, setValuation] = useState<{ items: any[]; total: number } | null>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [byHour, setByHour] = useState<any[]>([]);
  const [finSummary, setFinSummary] = useState<{ income: number; expense: number; profit: number } | null>(null);

  useEffect(() => {
    if (!ready) return;
    if (!user) { window.location.href = '/login'; return; }
    if (view !== 'ventas-dia') return;
    (async function load() {
      setLoading(true);
      const res = await fetchWithAuth(`${API}/orders?date=${date}`);
      const json = await res.json();
      setOrders(Array.isArray(json) ? json : []);
      setLoading(false);
    })();
  }, [date, ready, user, view]);

  // Loaders for other views
  useEffect(() => {
    if (!ready || !user) return;
    if (view !== 'top-products') return;
    (async () => {
      setLoading(true);
      const url = new URL(`${API}/reports/top-products`);
      if (from) url.searchParams.set('from', from);
      if (to) url.searchParams.set('to', to);
      if (limit) url.searchParams.set('limit', limit);
      const res = await fetchWithAuth(url.toString());
      const json = await res.json();
      setTopProducts(Array.isArray(json) ? json : []);
      setLoading(false);
    })();
  }, [ready, user, view, from, to, limit]);

  useEffect(() => {
    if (!ready || !user) return;
    if (view !== 'inventory-valuation') return;
    (async () => {
      setLoading(true);
      const res = await fetchWithAuth(`${API}/reports/inventory-valuation`);
      const json = await res.json();
      setValuation(json && typeof json === 'object' ? json : { items: [], total: 0 });
      setLoading(false);
    })();
  }, [ready, user, view]);

  useEffect(() => {
    if (!ready || !user) return;
    if (view !== 'employees-sales') return;
    (async () => {
      setLoading(true);
      const url = new URL(`${API}/reports/employees-sales`);
      if (from) url.searchParams.set('from', from);
      if (to) url.searchParams.set('to', to);
      const res = await fetchWithAuth(url.toString());
      const json = await res.json();
      setEmployees(Array.isArray(json) ? json : []);
      setLoading(false);
    })();
  }, [ready, user, view, from, to]);

  useEffect(() => {
    if (!ready || !user) return;
    if (view !== 'sales-by-hour') return;
    (async () => {
      setLoading(true);
      const res = await fetchWithAuth(`${API}/reports/sales-by-hour?date=${date}`);
      const json = await res.json();
      setByHour(Array.isArray(json) ? json : []);
      setLoading(false);
    })();
  }, [ready, user, view, date]);

  useEffect(() => {
    if (!ready || !user) return;
    if (view !== 'financial-summary') return;
    (async () => {
      setLoading(true);
      const url = new URL(`${API}/reports/financial-summary`);
      if (from) url.searchParams.set('from', from);
      if (to) url.searchParams.set('to', to);
      const res = await fetchWithAuth(url.toString());
      const json = await res.json();
      setFinSummary(json && typeof json === 'object' ? json : { income: 0, expense: 0, profit: 0 });
      setLoading(false);
    })();
  }, [ready, user, view, from, to]);

  const totals = useMemo(() => {
    const total = orders.reduce((a, o)=> a + Number(o.total||0), 0);
    const pagos = orders.flatMap(o=>o.payments||[]).reduce((a,p)=> a + Number(p.amount||0), 0);
    return { total, pagos };
  }, [orders]);

  return (
  <main>
      {view === 'menu' && (
        <>
          <h1>Informes</h1>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <button
              className="card p-6 text-left hover:shadow-md transition-shadow"
              onClick={() => setView('ventas-dia')}
            >
              <div className="text-lg font-semibold">Ventas del día</div>
              <div className="text-sm text-gray-600">Ver ventas totales, pagos e ítems por día</div>
            </button>
            <button className="card p-6 text-left hover:shadow-md transition-shadow" onClick={() => setView('top-products')}>
              <div className="text-lg font-semibold">Productos más vendidos</div>
              <div className="text-sm text-gray-600">Ranking por cantidad y total</div>
            </button>
            <button className="card p-6 text-left hover:shadow-md transition-shadow" onClick={() => setView('inventory-valuation')}>
              <div className="text-lg font-semibold">Valorización del inventario</div>
              <div className="text-sm text-gray-600">Costo total invertido en stock</div>
            </button>
            <button className="card p-6 text-left hover:shadow-md transition-shadow" onClick={() => setView('employees-sales')}>
              <div className="text-lg font-semibold">Ventas por empleado</div>
              <div className="text-sm text-gray-600">Órdenes y total por vendedor</div>
            </button>
            <button className="card p-6 text-left hover:shadow-md transition-shadow" onClick={() => setView('sales-by-hour')}>
              <div className="text-lg font-semibold">Ventas por hora</div>
              <div className="text-sm text-gray-600">Identifica picos de demanda</div>
            </button>
            <button className="card p-6 text-left hover:shadow-md transition-shadow" onClick={() => setView('financial-summary')}>
              <div className="text-lg font-semibold">Resumen financiero</div>
              <div className="text-sm text-gray-600">Ingresos, gastos y utilidad</div>
            </button>
          </div>
        </>
      )}

      {view === 'ventas-dia' && (
        <>
          <div className="flex items-center justify-between">
            <h1>Ventas del día</h1>
            <button className="text-sm text-blue-700 hover:underline" onClick={() => setView('menu')}>← Volver a informes</button>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <label className="text-sm">Fecha:</label>
            <input type="date" className="border rounded p-2" value={date} onChange={e=>setDate(e.target.value)} />
          </div>
          {loading && <p className="mt-4">Cargando...</p>}
          <div className="mt-4 card p-3">
            <div className="font-medium">Resumen</div>
            <div className="text-sm text-gray-600">Órdenes: {orders.length} · Total: {formatCLP(totals.total)} · Pagos: {formatCLP(totals.pagos)}</div>
          </div>
          <ul className="mt-4 grid gap-3">
            {orders.map(o => (
              <li key={o.id} className="card p-3">
                <div className="flex items-center justify-between">
                  <div className="font-medium">Orden #{o.number} · {new Date(o.openedAt).toLocaleTimeString('es-CL', { timeZone: CHILE_TZ, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}</div>
                  <div className="font-semibold">{formatCLP(Number(o.total||0))}</div>
                </div>
                <ul className="mt-2 text-sm text-gray-700">
                  {(o.items||[]).map((it:any, idx:number)=> (
                    <li key={idx} className="flex justify-between">
                      <span>{it.description} × {it.qty}</span>
                      <span>{formatCLP(Number(it.total||0))}</span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </>
      )}

      {view === 'top-products' && (
        <>
          <div className="flex items-center justify-between">
            <h1>Productos más vendidos</h1>
            <button className="text-sm text-blue-700 hover:underline" onClick={() => setView('menu')}>← Volver a informes</button>
          </div>
          <div className="mt-4 flex flex-wrap items-end gap-3">
            <div>
              <label className="text-sm">Desde:</label>
              <input type="date" className="border rounded p-2" value={from} onChange={e=>setFrom(e.target.value)} />
            </div>
            <div>
              <label className="text-sm">Hasta:</label>
              <input type="date" className="border rounded p-2" value={to} onChange={e=>setTo(e.target.value)} />
            </div>
            <div>
              <label className="text-sm">Límite:</label>
              <input type="number" className="border rounded p-2 w-24" value={limit} onChange={e=>setLimit(e.target.value)} />
            </div>
          </div>
          {loading && <p className="mt-4">Cargando...</p>}
          <ul className="mt-4 grid gap-2">
            {topProducts.map((r:any, i:number)=> (
              <li key={r.id || i} className="card p-3 flex items-center justify-between">
                <div><span className="text-gray-500 mr-2">#{i+1}</span>{r.name}</div>
                <div className="text-sm">Cant: {Number(r.qty||0)} · Total: {formatCLP(Number(r.total||0))}</div>
              </li>
            ))}
          </ul>
        </>
      )}

      {view === 'inventory-valuation' && (
        <>
          <div className="flex items-center justify-between">
            <h1>Valorización del inventario</h1>
            <button className="text-sm text-blue-700 hover:underline" onClick={() => setView('menu')}>← Volver a informes</button>
          </div>
          {loading && <p className="mt-4">Cargando...</p>}
          <div className="mt-4 card p-3">
            <div className="font-medium">Total invertido: {formatCLP(Number(valuation?.total||0))}</div>
          </div>
          <ul className="mt-4 grid gap-2">
            {(valuation?.items||[]).map((it:any, idx:number)=> (
              <li key={it.variant_id || idx} className="card p-3 flex items-center justify-between">
                <div>{it.name || it.variant_name ? `${it.name || ''} ${it.variant_name? '· '+it.variant_name: ''}` : (it.product_name || '')}</div>
                <div className="text-sm">Cant: {Number(it.quantity||0)} · Costo: {formatCLP(Number(it.cost||0))} · Valor: {formatCLP(Number(it.value||0))}</div>
              </li>
            ))}
          </ul>
        </>
      )}

      {view === 'employees-sales' && (
        <>
          <div className="flex items-center justify-between">
            <h1>Ventas por empleado</h1>
            <button className="text-sm text-blue-700 hover:underline" onClick={() => setView('menu')}>← Volver a informes</button>
          </div>
          <div className="mt-4 flex flex-wrap items-end gap-3">
            <div>
              <label className="text-sm">Desde:</label>
              <input type="date" className="border rounded p-2" value={from} onChange={e=>setFrom(e.target.value)} />
            </div>
            <div>
              <label className="text-sm">Hasta:</label>
              <input type="date" className="border rounded p-2" value={to} onChange={e=>setTo(e.target.value)} />
            </div>
          </div>
          {loading && <p className="mt-4">Cargando...</p>}
          <ul className="mt-4 grid gap-2">
            {employees.map((r:any)=> (
              <li key={r.id} className="card p-3 flex items-center justify-between">
                <div>{r.name}</div>
                <div className="text-sm">Órdenes: {Number(r.orders||0)} · Total: {formatCLP(Number(r.total||0))}</div>
              </li>
            ))}
          </ul>
        </>
      )}

      {view === 'sales-by-hour' && (
        <>
          <div className="flex items-center justify-between">
            <h1>Ventas por hora</h1>
            <button className="text-sm text-blue-700 hover:underline" onClick={() => setView('menu')}>← Volver a informes</button>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <label className="text-sm">Fecha:</label>
            <input type="date" className="border rounded p-2" value={date} onChange={e=>setDate(e.target.value)} />
          </div>
          {loading && <p className="mt-4">Cargando...</p>}
          <ul className="mt-4 grid gap-2">
            {byHour.map((r:any)=> (
              <li key={r.hour} className="card p-3 flex items-center justify-between">
                <div>{String(r.hour).padStart(2,'0')}:00</div>
                <div className="text-sm">Órdenes: {Number(r.orders||0)} · Total: {formatCLP(Number(r.total||0))}</div>
              </li>
            ))}
          </ul>
        </>
      )}

      {view === 'financial-summary' && (
        <>
          <div className="flex items-center justify-between">
            <h1>Resumen financiero</h1>
            <button className="text-sm text-blue-700 hover:underline" onClick={() => setView('menu')}>← Volver a informes</button>
          </div>
          <div className="mt-4 flex flex-wrap items-end gap-3">
            <div>
              <label className="text-sm">Desde:</label>
              <input type="date" className="border rounded p-2" value={from} onChange={e=>setFrom(e.target.value)} />
            </div>
            <div>
              <label className="text-sm">Hasta:</label>
              <input type="date" className="border rounded p-2" value={to} onChange={e=>setTo(e.target.value)} />
            </div>
          </div>
          {loading && <p className="mt-4">Cargando...</p>}
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="card p-3">
              <div className="text-sm text-gray-600">Ingresos</div>
              <div className="text-xl font-semibold">{formatCLP(Number(finSummary?.income||0))}</div>
            </div>
            <div className="card p-3">
              <div className="text-sm text-gray-600">Gastos</div>
              <div className="text-xl font-semibold">{formatCLP(Number(finSummary?.expense||0))}</div>
            </div>
            <div className="card p-3">
              <div className="text-sm text-gray-600">Utilidad</div>
              <div className="text-xl font-semibold">{formatCLP(Number(finSummary?.profit||0))}</div>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
