"use client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-context";
import { useRouter } from "next/navigation";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function InventarioDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const { user, ready, fetchWithAuth } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [form, setForm] = useState({ name: "", price: "", quantity: "", category: "", type: "", imageUrl: "", description: "", isSellable: true, isStockItem: false, cost: "", active: true, size: "" });
  const [types, setTypes] = useState<{id:string; name:string}[]>([]);
  const [categories, setCategories] = useState<{id:string; name:string}[]>([]);
  const [showCatList, setShowCatList] = useState(false);
  const [catError, setCatError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Guard: only ADMIN or JEFE_LOCAL can access
  useEffect(() => {
    if (!ready) return;
    if (!user) {
      window.location.href = "/login";
      return;
    }
    if (user.role !== "ADMIN" && user.role !== "JEFE_LOCAL") {
      window.location.href = "/pos";
    }
  }, [ready, user]);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const res = await fetch(`${API}/products/${id}`);
      const json = await res.json();
      setData(json);
      setForm({
        name: json?.name ?? "",
        price: json?.variants?.[0]?.price ?? "",
        quantity: json?.variants?.[0]?.quantity ?? "",
        category: json?.category?.name ?? "",
        type: json?.type?.name ?? "",
        imageUrl: json?.imageUrl ?? "",
        description: json?.description ?? "",
        isSellable: json?.isSellable ?? true,
        isStockItem: json?.isStockItem ?? false,
        cost: json?.variants?.[0]?.cost ?? "",
        active: json?.variants?.[0]?.active ?? true,
        size: json?.variants?.[0]?.name ?? "",
      });
      setLoading(false);
    })();
  }, [id]);

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
    setSaving(true);
    // Validate category against existing types
    const exists = types.some(t => t.name.toLowerCase() === String(form.category||'').toLowerCase());
    if (!exists) {
      setCatError('Selecciona una categoría de la lista (Tipo de producto existente)');
      setSaving(false);
      return;
    }
    const fd = new FormData();
    fd.set('name', form.name);
    fd.set('price', String(form.price));
    fd.set('quantity', String(form.quantity));
  fd.set('category', form.category);
  if (form.description) fd.set('description', form.description);
  fd.set('isSellable', String(form.isSellable));
  fd.set('isStockItem', String(form.isStockItem));
  if (form.cost) fd.set('cost', String(form.cost));
  fd.set('active', String(form.active));
  if (form.size) fd.set('size', form.size);
  if (form.type) fd.set('type', form.type);
    if (form.imageUrl) fd.set('imageUrl', form.imageUrl);
    if (file) fd.set('image', file);
    await fetchWithAuth(`${API}/products/${id}`, { method: 'PATCH', body: fd });
  setSaving(false);
  router.push("/inventario");
  }

  if (loading) return <main>Cargando...</main>;

  return (
    <main>
  <Link href="/inventario" className="text-sm text-blue-700 hover:underline">← Volver a la lista de inventario</Link>
      <h1 className="mt-2">Editar producto</h1>
      <div className="mt-4 grid gap-3">
        <input className="border rounded p-2 w-full h-10" placeholder="Nombre" value={form.name} onChange={e=>setForm({...form, name:e.target.value})}/>
        <input className="border rounded p-2 w-full h-10" type="number" placeholder="Precio" value={form.price} onChange={e=>setForm({...form, price:e.target.value})}/>
        <input className="border rounded p-2 w-full h-10" type="number" placeholder="Cantidad" value={form.quantity} onChange={e=>setForm({...form, quantity:e.target.value})}/>
        <div className="relative">
          <input
            className="border rounded p-2 w-full h-10 pr-8"
            placeholder="Categoría"
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
        <textarea className="border rounded p-2 w-full" placeholder="Descripción" value={form.description} onChange={e=>setForm({...form, description:e.target.value})} />
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2"><input type="checkbox" checked={form.isSellable} onChange={e=>setForm({...form, isSellable: e.target.checked})}/> Vendible</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={form.isStockItem} onChange={e=>setForm({...form, isStockItem: e.target.checked})}/> Controla stock</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={form.active} onChange={e=>setForm({...form, active: e.target.checked})}/> Variante activa</label>
        </div>
        <input className="border rounded p-2 w-full h-10" type="text" placeholder="Tamaño / nombre variante" value={form.size} onChange={e=>setForm({...form, size:e.target.value})}/>
        <input className="border rounded p-2 w-full h-10" type="number" placeholder="Costo (opcional)" value={form.cost} onChange={e=>setForm({...form, cost:e.target.value})}/>
        <div className="grid gap-2">
          <input type="file" accept="image/*" onChange={e=> setFile(e.target.files?.[0] || null)} />
          {(file || form.imageUrl) && (
            <img alt="preview" className="h-40 w-40 object-cover border rounded" src={file ? URL.createObjectURL(file) : `${API}/products/${id}/image`} onError={(ev)=>{ (ev.target as HTMLImageElement).src = form.imageUrl || '' }} />
          )}
          <input className="border rounded p-2 w-full h-10" placeholder="URL de imagen (opcional)" value={form.imageUrl} onChange={e=>setForm({...form, imageUrl:e.target.value})}/>
        </div>
      </div>
      <button className="mt-4 primary" onClick={onSave} disabled={saving}>
        {saving ? 'Guardando...' : 'Guardar'}
      </button>
    </main>
  );
}
