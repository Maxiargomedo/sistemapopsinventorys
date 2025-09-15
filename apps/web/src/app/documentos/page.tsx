"use client";
import { useEffect, useMemo, useState } from "react";
import { formatCLP } from "@/lib/format";
import { useAuth } from "@/components/auth-context";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const CHILE_TZ = "America/Santiago";

function todayYMDInTZ(tz: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

export default function DocumentosPage() {
  const { user, ready, fetchWithAuth } = useAuth();
  const [view, setView] = useState<'menu' | 'reimpresion' | 'compras'>('menu');

  // Reimpresión de comprobantes
  const [date, setDate] = useState(() => todayYMDInTZ(CHILE_TZ));
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [printData, setPrintData] = useState<any | null>(null);

  // Facturas de compra
  const [q, setQ] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [invoices, setInvoices] = useState<any[]>([]);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadForm, setUploadForm] = useState({ invoiceNumber: "", companyName: "", invoiceDate: todayYMDInTZ(CHILE_TZ), total: "", file: null as File | null });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!ready) return;
    if (!user) { window.location.href = "/login"; return; }
  }, [user, ready]);

  // Cargar órdenes del día para reimpresión
  useEffect(() => {
    if (!ready || !user) return;
    if (view !== 'reimpresion') return;
    (async () => {
      setLoading(true);
      const res = await fetchWithAuth(`${API}/orders?date=${date}`);
      const json = await res.json();
      setOrders(Array.isArray(json) ? json : []);
      setLoading(false);
    })();
  }, [ready, user, view, date, fetchWithAuth]);

  // Cargar facturas de compra
  useEffect(() => {
    if (!ready || !user) return;
    if (view !== 'compras') return;
    (async () => {
      setLoading(true);
      const url = new URL(`${API}/invoices`);
      if (from) url.searchParams.set('from', from);
      if (to) url.searchParams.set('to', to);
      if (q) url.searchParams.set('q', q);
      const res = await fetchWithAuth(url.toString());
      const json = await res.json();
      setInvoices(Array.isArray(json) ? json : []);
      setLoading(false);
    })();
  }, [ready, user, view, from, to, q, fetchWithAuth]);

  function openPrint(order: any) {
    const items = (order.items || []).map((oi: any) => ({ name: oi.description, variantName: '', qty: Number(oi.qty||0), price: Number(oi.unitPrice||0) }));
    setPrintData({ businessName: 'Mi Negocio', order, items, total: Number(order.total||0), payMethod: (order.payments?.[0]?.method || 'EFECTIVO').toLowerCase() });
  }

  async function submitInvoice(e: React.FormEvent) {
    e.preventDefault();
    if (!uploadForm.file) return alert('Adjunte un archivo');
    setSaving(true);
    try {
      const fd = new FormData();
      fd.set('invoiceNumber', uploadForm.invoiceNumber);
      fd.set('companyName', uploadForm.companyName);
      fd.set('invoiceDate', uploadForm.invoiceDate);
      fd.set('total', String(uploadForm.total));
      fd.set('file', uploadForm.file);
      const res = await fetchWithAuth(`${API}/invoices`, { method: 'POST', body: fd });
      if (!res.ok) throw new Error('Error al guardar');
      setUploadOpen(false);
      setUploadForm({ invoiceNumber: "", companyName: "", invoiceDate: todayYMDInTZ(CHILE_TZ), total: "", file: null });
      // reload
      const url = new URL(`${API}/invoices`);
      if (from) url.searchParams.set('from', from);
      if (to) url.searchParams.set('to', to);
      if (q) url.searchParams.set('q', q);
      const r2 = await fetchWithAuth(url.toString());
      setInvoices(await r2.json());
    } catch (err: any) {
      alert(err.message || 'Error');
    } finally {
      setSaving(false);
    }
  }

  async function viewInvoiceFile(id: string, suggestedName?: string) {
    try {
      const res = await fetchWithAuth(`${API}/invoices/${id}/file`);
      if (!res.ok) throw new Error('No se pudo abrir el archivo');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      // Abrir en nueva pestaña; algunos navegadores muestran inline si es PDF/imagen
      window.open(url, '_blank');
      // Liberar URL más tarde
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (e: any) {
      alert(e.message || 'Error al abrir archivo');
    }
  }

  return (
  <main>
      {view === 'menu' && (
        <>
          <h1>Documentos</h1>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <button className="card p-6 text-left hover:shadow-md transition-shadow" onClick={() => setView('reimpresion')}>
              <div className="text-lg font-semibold">Comprobante de ventas (reimpresión)</div>
              <div className="text-sm text-gray-600">Ver ventas por día y reimprimir el comprobante</div>
            </button>
            {user?.role !== 'VENDEDOR' && (
              <button className="card p-6 text-left hover:shadow-md transition-shadow" onClick={() => setView('compras')}>
                <div className="text-lg font-semibold">Facturas de compra local</div>
                <div className="text-sm text-gray-600">Consultar y subir facturas con respaldo</div>
              </button>
            )}
          </div>
        </>
      )}

      {view === 'reimpresion' && (
        <>
          <div className="flex items-center justify-between">
            <h1>Reimpresión de comprobantes</h1>
            <button className="text-sm underline" onClick={() => setView('menu')}>← Volver</button>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <label className="text-sm">Fecha</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="border rounded px-2 py-1" />
          </div>
          <div className="mt-4 card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-2">#</th>
                  <th className="text-left p-2">Hora</th>
                  <th className="text-left p-2">Total</th>
                  <th className="text-left p-2">Pagos</th>
                  <th className="p-2">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading && (<tr><td colSpan={5} className="p-4 text-center">Cargando...</td></tr>)}
                {!loading && orders.length === 0 && (<tr><td colSpan={5} className="p-4 text-center">Sin ventas</td></tr>)}
                {orders.map((o: any) => (
                  <tr key={o.id} className="border-t">
                    <td className="p-2">{o.number}</td>
                    <td className="p-2">{new Date(o.openedAt).toLocaleTimeString('es-CL', { timeZone: CHILE_TZ, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}</td>
                    <td className="p-2 font-medium">{formatCLP(Number(o.total||0))}</td>
                    <td className="p-2">{(o.payments||[]).map((p:any)=>p.method).join(', ')}</td>
                    <td className="p-2 text-center"><button className="secondary" onClick={() => openPrint(o)}>Reimprimir</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {printData && <ReprintOverlay data={printData} onClose={() => setPrintData(null)} cashierName={user?.fullName} />}
        </>
      )}

      {view === 'compras' && (
        <>
          <div className="flex items-center justify-between">
            <h1>Facturas de compra local</h1>
            <button className="text-sm underline" onClick={() => setView('menu')}>← Volver</button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 items-end">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Buscar</label>
              <input placeholder="N° factura o empresa" className="border rounded px-2 py-1" value={q} onChange={e=>setQ(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Desde</label>
              <input type="date" className="border rounded px-2 py-1" value={from} onChange={e=>setFrom(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Hasta</label>
              <input type="date" className="border rounded px-2 py-1" value={to} onChange={e=>setTo(e.target.value)} />
            </div>
            <div className="flex-1" />
            <button className="primary" onClick={() => setUploadOpen(true)}>+ Subir factura de compra</button>
          </div>
          <div className="mt-4 card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-2">N° factura</th>
                  <th className="text-left p-2">Empresa</th>
                  <th className="text-left p-2">Fecha</th>
                  <th className="text-left p-2">Monto total</th>
                  <th className="p-2">Archivo</th>
                </tr>
              </thead>
              <tbody>
                {loading && (<tr><td colSpan={5} className="p-4 text-center">Cargando...</td></tr>)}
                {!loading && invoices.length === 0 && (<tr><td colSpan={5} className="p-4 text-center">Sin facturas</td></tr>)}
                {invoices.map((inv: any) => (
                  <tr key={inv.id} className="border-t">
                    <td className="p-2">{inv.invoiceNumber}</td>
                    <td className="p-2">{inv.companyName}</td>
                    <td className="p-2">{new Date(inv.invoiceDate).toLocaleDateString('es-CL', { timeZone: CHILE_TZ })} <span className="text-gray-500">(subida: {new Date(inv.uploadedAt).toLocaleDateString('es-CL', { timeZone: CHILE_TZ })})</span></td>
                    <td className="p-2 font-medium">{formatCLP(Number(inv.total||0))}</td>
                    <td className="p-2 text-center">
                      <button className="secondary" onClick={() => viewInvoiceFile(inv.id, inv.fileName || `factura-${inv.invoiceNumber}`)}>Ver</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {uploadOpen && (
            <div className="fixed inset-0 z-50">
              <div className="absolute inset-0 bg-black/40" onClick={() => setUploadOpen(false)} />
              <div className="absolute inset-x-0 bottom-0 sm:inset-0 sm:flex sm:items-center sm:justify-center">
                <form onSubmit={submitInvoice} className="bg-white rounded-t-2xl sm:rounded-xl shadow-2xl p-4 w-full sm:w-[520px]">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Subir factura de compra</h3>
                    <button type="button" className="text-sm text-gray-600" onClick={() => setUploadOpen(false)}>Cerrar</button>
                  </div>
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Número de factura</label>
                      <input required className="border rounded px-2 py-1 w-full" value={uploadForm.invoiceNumber} onChange={e=>setUploadForm(f=>({...f, invoiceNumber: e.target.value}))} />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Nombre de la empresa</label>
                      <input required className="border rounded px-2 py-1 w-full" value={uploadForm.companyName} onChange={e=>setUploadForm(f=>({...f, companyName: e.target.value}))} />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Fecha de la factura</label>
                      <input type="date" className="border rounded px-2 py-1 w-full" value={uploadForm.invoiceDate} onChange={e=>setUploadForm(f=>({...f, invoiceDate: e.target.value}))} />
                      <div className="text-[11px] text-gray-500 mt-1">Por defecto hoy. Si cargas una factura de fecha pasada, se mostrará (Fecha factura) y entre paréntesis (Fecha subida) para control.</div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Monto total</label>
                      <input required type="number" min="0" step="0.01" className="border rounded px-2 py-1 w-full" value={uploadForm.total} onChange={e=>setUploadForm(f=>({...f, total: e.target.value}))} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs text-gray-600 mb-1">Archivo (imagen o PDF)</label>
                      <input required type="file" accept="image/*,application/pdf" onChange={e=>setUploadForm(f=>({...f, file: e.target.files?.[0] || null}))} />
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end gap-2">
                    <button type="button" className="secondary" onClick={() => setUploadOpen(false)}>Cancelar</button>
                    <button disabled={saving} type="submit" className="primary">{saving ? 'Guardando…' : 'Guardar factura'}</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      )}
    </main>
  );
}

function ReprintOverlay({ data, onClose, cashierName }: { data: { businessName: string; order: any; items: Array<{ name: string; variantName?: string; qty: number; price: number }>; total: number; payMethod?: string; }; onClose: () => void; cashierName?: string }) {
  useEffect(() => {
    const handler = () => { onClose(); };
    if (typeof window !== 'undefined') {
      window.addEventListener('afterprint', handler);
    }
    return () => { if (typeof window !== 'undefined') window.removeEventListener('afterprint', handler); };
  }, [onClose]);
  const issuedAt = new Date();
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
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
      <div className="only-print">
        <ReceiptContent id="print-receipt" data={data} cashierName={cashierName} issuedAt={issuedAt} />
      </div>
    </div>
  );
}

function ReceiptContent({ id, data, cashierName, issuedAt }: { id: string; data: { businessName: string; order: any; items: any[]; total: number; payMethod?: string }; cashierName?: string; issuedAt: Date; }) {
  const { businessName, items, total, payMethod } = data;
  return (
    <div id={id} className="print-area">
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: 16, margin: '4px 0' }}>{businessName}</h1>
        <div className="muted">Comprobante de venta</div>
      </div>
      <div className="muted" style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
        <span>Fecha: {issuedAt.toLocaleString('es-CL', { timeZone: CHILE_TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}</span>
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
              <td style={{ padding: '4px 0', borderBottom: '1px dashed #ddd', fontSize: 13 }}>{it.name}{it.variantName ? ` · ${it.variantName}` : ''}</td>
              <td style={{ padding: '4px 0', borderBottom: '1px dashed #ddd', fontSize: 13, textAlign: 'center' }}>{it.qty}</td>
              <td style={{ padding: '4px 0', borderBottom: '1px dashed #ddd', fontSize: 13, textAlign: 'right' }}>{formatCLP(it.price * it.qty)}</td>
            </tr>
          ))}
        </tbody>
      </table>
  <div style={{ textAlign: 'right', marginTop: 8, fontWeight: 'bold' }}>Total: {formatCLP(total)}</div>
      <div style={{ textAlign: 'center', marginTop: 12 }}>Reimpresión</div>
    </div>
  );
}
