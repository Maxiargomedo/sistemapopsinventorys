"use client";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth-context";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

type Settings = {
  id?: string;
  companyName?: string;
  rut?: string;
  address?: string;
  phone?: string;
  email?: string;
  receiptMessage?: string;
  currency?: string;
  dateTimeFormat?: string;
  taxName?: string;
  taxRate?: number;
  documentType?: string;
  defaultPrinter?: string;
  autoCopies?: number;
  hasLogo?: boolean;
};

export default function DistConfigPage() {
  const { user, ready, fetchWithAuth } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [s, setS] = useState<Settings>({ currency: 'CLP', dateTimeFormat: 'DD/MM/YYYY HH:mm', taxName: 'IVA', taxRate: 0, autoCopies: 1 });
  const [types, setTypes] = useState<{id:string; name:string}[]>([]);
  const [newType, setNewType] = useState("");

  useEffect(() => {
    if (!ready) return;
    if (!user) { window.location.href = "/login"; return; }
    if (user.role !== 'ADMIN') { window.location.href = "/pos"; return; }
    (async () => {
      try {
        const res = await fetch(`${API}/settings`);
        const json = await res.json();
        setS(json);
        // load types as well
        const t = await fetch(`${API}/product-types`).then(r=>r.json());
        setTypes(t);
      } finally {
        setLoading(false);
      }
    })();
  }, [user, ready]);

  async function onSave() {
    setSaving(true);
    try {
      const fd = new FormData();
      if (s.companyName) fd.set('companyName', s.companyName);
      if (s.rut) fd.set('rut', s.rut);
      if (s.address) fd.set('address', s.address);
      if (s.phone) fd.set('phone', s.phone);
      if (s.email) fd.set('email', s.email);
      if (s.receiptMessage) fd.set('receiptMessage', s.receiptMessage);
      if (s.currency) fd.set('currency', s.currency);
      if (s.dateTimeFormat) fd.set('dateTimeFormat', s.dateTimeFormat);
      if (s.taxName) fd.set('taxName', s.taxName);
      if (typeof s.taxRate === 'number') fd.set('taxRate', String(s.taxRate));
      if (s.documentType) fd.set('documentType', s.documentType);
      if (s.defaultPrinter) fd.set('defaultPrinter', s.defaultPrinter);
      if (typeof s.autoCopies === 'number') fd.set('autoCopies', String(s.autoCopies));
      if (logoFile) fd.set('logo', logoFile);
      const res = await fetchWithAuth(`${API}/settings`, { method: 'PUT', body: fd });
      if (!res.ok) { alert('Error al guardar'); return; }
      const json = await res.json();
      setS(json);
      setLogoFile(null);
      alert('Guardado');
    } catch (e) {
      console.error(e);
      alert('Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold">⚙️ Configuración General</h1>
      {loading ? (
        <p className="mt-4">Cargando…</p>
      ) : (
        <div className="mt-6 grid gap-6">
          {/* Datos de la empresa */}
          <section className="card p-4">
            <h2 className="text-lg font-medium">Datos de la empresa</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-sm text-gray-600">Nombre / Razón social</label>
                <input value={s.companyName || ''} onChange={e=>setS({...s, companyName: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm text-gray-600">RUT</label>
                <input value={s.rut || ''} onChange={e=>setS({...s, rut: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm text-gray-600">Dirección</label>
                <input value={s.address || ''} onChange={e=>setS({...s, address: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm text-gray-600">Teléfono</label>
                <input value={s.phone || ''} onChange={e=>setS({...s, phone: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm text-gray-600">Correo</label>
                <input type="email" value={s.email || ''} onChange={e=>setS({...s, email: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm text-gray-600">Logo de la empresa</label>
                <input type="file" accept="image/*" onChange={e=>setLogoFile(e.target.files?.[0] || null)} />
                {s.hasLogo && <p className="text-xs text-gray-500 mt-1">Logo cargado</p>}
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm text-gray-600">Mensaje en boletas/facturas</label>
                <textarea value={s.receiptMessage || ''} onChange={e=>setS({...s, receiptMessage: e.target.value})} />
              </div>
            </div>
          </section>

          {/* Moneda y formato */}
          <section className="card p-4">
            <h2 className="text-lg font-medium">Moneda y formato</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-sm text-gray-600">Tipo de moneda</label>
                <input value={s.currency || ''} onChange={e=>setS({...s, currency: e.target.value})} placeholder="CLP, USD, etc." />
              </div>
              <div>
                <label className="block text-sm text-gray-600">Formato de fecha y hora</label>
                <input value={s.dateTimeFormat || ''} onChange={e=>setS({...s, dateTimeFormat: e.target.value})} placeholder="DD/MM/YYYY HH:mm" />
              </div>
            </div>
          </section>

          {/* Impuestos */}
          <section className="card p-4">
            <h2 className="text-lg font-medium">Impuestos</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-sm text-gray-600">Nombre del impuesto</label>
                <input value={s.taxName || ''} onChange={e=>setS({...s, taxName: e.target.value})} placeholder="IVA" />
              </div>
              <div>
                <label className="block text-sm text-gray-600">Tasa (%)</label>
                <input type="number" step="0.01" value={s.taxRate ?? 0} onChange={e=>setS({...s, taxRate: Number(e.target.value)})} />
              </div>
            </div>
          </section>

          {/* Impresión y documentos */}
          <section className="card p-4">
            <h2 className="text-lg font-medium">Impresión y documentos</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-sm text-gray-600">Configuración de boleta/factura</label>
                <input value={s.documentType || ''} onChange={e=>setS({...s, documentType: e.target.value})} placeholder="Boleta, Factura, etc." />
              </div>
              <div>
                <label className="block text-sm text-gray-600">Impresora por defecto</label>
                <input value={s.defaultPrinter || ''} onChange={e=>setS({...s, defaultPrinter: e.target.value})} placeholder="Nombre del dispositivo" />
              </div>
              <div>
                <label className="block text-sm text-gray-600">Copias automáticas</label>
                <input type="number" min={0} value={s.autoCopies ?? 1} onChange={e=>setS({...s, autoCopies: Number(e.target.value)})} />
              </div>
            </div>
          </section>

          {/* Tipos de producto */}
          <section className="card p-4">
            <h2 className="text-lg font-medium">Tipos de producto</h2>
            <div className="mt-3 flex gap-2">
              <input className="flex-1" placeholder="Agregar tipo (ej: Comida, Bebidas)" value={newType} onChange={e=>setNewType(e.target.value)} />
              <button className="primary" onClick={async()=>{
                const name = newType.trim(); if (!name) return;
                const res = await fetchWithAuth(`${API}/product-types`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
                if (!res.ok) { alert('No se pudo crear'); return; }
                const created = await res.json();
                setTypes(prev=>[...prev, created].sort((a,b)=>a.name.localeCompare(b.name)));
                setNewType("");
              }}>Agregar</button>
            </div>
            <ul className="mt-3 grid gap-2">
              {types.map(t=> (
                <li key={t.id} className="flex items-center justify-between border rounded p-2">
                  <span>{t.name}</span>
                  <button className="danger" onClick={async()=>{
                    if (!confirm(`¿Eliminar tipo "${t.name}"?`)) return;
                    const res = await fetchWithAuth(`${API}/product-types/${t.id}`, { method: 'DELETE' });
                    if (res.ok) setTypes(prev=>prev.filter(x=>x.id!==t.id));
                    else alert('No se pudo eliminar');
                  }}>Eliminar</button>
                </li>
              ))}
              {types.length===0 && <li className="text-sm text-gray-600">Aún no hay tipos. Agrega uno arriba.</li>}
            </ul>
          </section>

          <div className="flex justify-end gap-2">
            <button className="secondary" onClick={()=>window.history.back()} disabled={saving}>Cancelar</button>
            <button className="primary" onClick={onSave} disabled={saving}>{saving ? 'Guardando…' : 'Guardar cambios'}</button>
          </div>
        </div>
      )}
    </main>
  );
}
