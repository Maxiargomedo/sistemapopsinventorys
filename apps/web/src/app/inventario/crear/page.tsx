"use client";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth-context";
import { useRouter } from "next/navigation";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function InventarioCreatePage() {
  const { user, ready, fetchWithAuth } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    price: "",
    size: "",
    category: "",
    type: "",
    quantity: "",
    imageUrl: "",
    description: "",
    isSellable: true,
    isStockItem: false,
    cost: "",
    active: true,
  });
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [types, setTypes] = useState<{id:string; name:string}[]>([]);
  const [categories, setCategories] = useState<{id:string; name:string}[]>([]);
  const [showCatList, setShowCatList] = useState(false);
  const [catError, setCatError] = useState<string | null>(null);

  // Guard: only ADMIN or JEFE_LOCAL can access
  useEffect(() => {
    if (!ready) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.role !== "ADMIN" && user.role !== "JEFE_LOCAL") {
      router.replace("/pos");
    }
  }, [ready, user, router]);

  useEffect(() => {
    (async () => {
      try {
        const [tRes, cRes] = await Promise.all([
          fetch(`${API}/product-types`),
          fetch(`${API}/categories`),
        ]);
        setTypes(await tRes.json());
        setCategories(await cRes.json());
      } catch {}
    })();
  }, []);

  async function onSave() {
    setSaving(true); setError(null);
    try {
      // Validate category must exist in Product Types
      const exists = types.some(t => t.name.toLowerCase() === String(form.category||'').toLowerCase());
      if (!exists) {
        setCatError('Selecciona una categoría de la lista (Tipo de producto existente)');
        throw new Error('Categoría inválida');
      }
      const fd = new FormData();
      fd.set('name', form.name);
      fd.set('price', String(form.price));
      fd.set('category', form.category);
    if (form.size) fd.set('size', form.size);
      if (form.quantity) fd.set('quantity', String(form.quantity));
      if (form.imageUrl) fd.set('imageUrl', form.imageUrl);
  if (form.description) fd.set('description', form.description);
  fd.set('isSellable', String(form.isSellable));
  fd.set('isStockItem', String(form.isStockItem));
  if (form.cost) fd.set('cost', String(form.cost));
  fd.set('active', String(form.active));
    if (form.type) fd.set('type', form.type);
      if (file) fd.set('image', file);
      const res = await fetchWithAuth(`${API}/products`, { method: 'POST', body: fd });
      if (!res.ok) throw new Error('Error al guardar');
      const created = await res.json();
  // Volver a inventario resaltando el producto (el toast se mostrará allí)
  router.push(`/inventario?new=${encodeURIComponent(created.id)}&created=1`);
    } catch (e: any) {
      setError(e.message || 'Error inesperado');
    } finally { setSaving(false); }
  }

  return (
    <main>
  <Link href="/inventario" className="text-sm text-blue-700 hover:underline">← Volver a la lista de inventario</Link>
      <h1 className="mt-2">Crear producto</h1>
      <div className="mt-4 grid gap-3">
        <input className="border rounded p-2 w-full h-10" placeholder="Nombre del producto (obligatorio)" value={form.name} onChange={e=>setForm({...form, name:e.target.value})}/>
        <input className="border rounded p-2 w-full h-10" type="number" placeholder="Precio (obligatorio)" value={form.price} onChange={e=>setForm({...form, price:e.target.value})}/>
        <input className="border rounded p-2 w-full h-10" placeholder="Tamaño (opcional)" value={form.size} onChange={e=>setForm({...form, size:e.target.value})}/>
        <div className="relative">
          <input
            className="border rounded p-2 w-full h-10 pr-8"
            placeholder="Categoría (obligatorio)"
            value={form.category}
            onFocus={()=> setShowCatList(true)}
            onChange={e=>{ setForm({...form, category:e.target.value}); setShowCatList(true); setCatError(null); }}
            onBlur={()=> setTimeout(()=> setShowCatList(false), 120)}
            aria-autocomplete="list"
            aria-expanded={showCatList}
          />
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            onMouseDown={(e)=>{ e.preventDefault(); setShowCatList(v=>!v); }}
            aria-label="Mostrar categorías"
          >▾</button>
          {showCatList && (
            <ul className="absolute z-20 left-0 right-0 mt-1 bg-white border rounded shadow max-h-56 overflow-auto">
              {types.filter(t => !form.category || t.name.toLowerCase().includes(form.category.toLowerCase())).map(t => (
                <li key={t.id}>
                  <button
                    type="button"
                    className="w-full text-left px-3 py-2 hover:bg-gray-100"
                    onMouseDown={(e)=>{ e.preventDefault(); setForm({...form, category: t.name}); setCatError(null); setShowCatList(false); }}
                  >{t.name}</button>
                </li>
              ))}
              {types.length === 0 && (
                <li className="px-3 py-2 text-sm text-gray-500">No hay tipos de producto aún</li>
              )}
            </ul>
          )}
          {catError && <div className="text-sm text-red-600 mt-1">{catError}</div>}
        </div>
        <div>
          <input className="border rounded p-2 w-full h-10" list="types-list" placeholder="Tipo de producto (opcional)" value={form.type} onChange={e=>setForm({...form, type:e.target.value})}/>
          <datalist id="types-list">
            {types.map(t=> <option key={t.id} value={t.name} />)}
          </datalist>
        </div>
        <input className="border rounded p-2 w-full h-10" type="number" placeholder="Cantidad (opcional)" value={form.quantity} onChange={e=>setForm({...form, quantity:e.target.value})}/>
        <textarea className="border rounded p-2 w-full" placeholder="Descripción (opcional)" value={form.description} onChange={e=>setForm({...form, description:e.target.value})} />
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2"><input type="checkbox" checked={form.isSellable} onChange={e=>setForm({...form, isSellable: e.target.checked})}/> Vendible</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={form.isStockItem} onChange={e=>setForm({...form, isStockItem: e.target.checked})}/> Controla stock</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={form.active} onChange={e=>setForm({...form, active: e.target.checked})}/> Variante activa</label>
        </div>
        <input className="border rounded p-2 w-full h-10" type="number" placeholder="Costo (opcional)" value={form.cost} onChange={e=>setForm({...form, cost:e.target.value})}/>
        <div className="grid gap-2">
          <input type="file" accept="image/*" onChange={e=> setFile(e.target.files?.[0] || null)} />
          {file && <img alt="preview" className="h-40 w-40 object-cover border rounded" src={URL.createObjectURL(file)} />}
          <input className="border rounded p-2 w-full h-10" placeholder="URL de imagen (opcional)" value={form.imageUrl} onChange={e=>setForm({...form, imageUrl:e.target.value})}/>
        </div>
      </div>
      {error && <p className="mt-2 text-red-600">{error}</p>}
      <button className="mt-4 primary" onClick={onSave} disabled={saving}>
        {saving ? 'Guardando...' : 'Guardar'}
      </button>
    </main>
  );
}
