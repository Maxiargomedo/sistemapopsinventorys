"use client";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatCLP } from "@/lib/format";
import { useAuth } from "@/components/auth-context";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function InventarioListPage() {
  const { user, ready, fetchWithAuth } = useAuth() as any;
  const router = useRouter();
  const [q, setQ] = useState("");
  const [deleteMode, setDeleteMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const searchParams = useSearchParams();
  const newId = searchParams?.get('new');
  const createdFlag = searchParams?.get('created');
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
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
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["inv-products"],
    queryFn: async () => (await fetch(`${API}/products`)).json(),
  });

  useEffect(() => {
    if (newId) {
      setHighlightId(newId);
      const t = setTimeout(() => setHighlightId(null), 3500);
      return () => clearTimeout(t);
    }
  }, [newId]);

  useEffect(() => {
    if (createdFlag === '1') {
      setShowToast(true);
      const t = setTimeout(() => setShowToast(false), 3000);
      return () => clearTimeout(t);
    }
  }, [createdFlag]);

  const filtered = useMemo(() => {
    const list = Array.isArray(data) ? data : [];
    if (!q.trim()) return list;
    const s = q.trim().toLowerCase();
    return list.filter((p: any) =>
      p?.name?.toLowerCase?.().includes(s) || p?.category?.name?.toLowerCase?.().includes(s)
    );
  }, [data, q]);

  return (
    <main>
      {showToast && (
        <div className="fixed bottom-4 right-4 z-40">
          <div className="bg-green-600 text-white px-4 py-2 rounded shadow-lg">Producto creado correctamente</div>
        </div>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1>Inventario</h1>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nombre o categoría..."
            className="w-full sm:w-80"
          />
          <Link href="/inventario/crear" className="primary whitespace-nowrap">+ Crear</Link>
          {deleteMode ? (
            <button className="secondary whitespace-nowrap" onClick={() => { setDeleteMode(false); setSelected(new Set()); }}>Volver</button>
          ) : (
            <button className="danger whitespace-nowrap" onClick={() => setDeleteMode(true)}>Borrar producto</button>
          )}
          {deleteMode && selected.size > 0 && (
            <button className="danger whitespace-nowrap" disabled={deleting} onClick={() => setConfirmOpen(true)}>
              {deleting ? 'Borrando…' : `Borrar ${selected.size} producto${selected.size>1?'s':''}`}
            </button>
          )}
        </div>
      </div>
      {isLoading && <p className="mt-4">Cargando...</p>}
      {error && <p className="mt-4 text-red-600">Error al cargar</p>}
      <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((p: any) => (
          <li key={p.id} className={`card p-4 relative transition-colors ${highlightId===p.id ? 'ring-2 ring-blue-400 bg-blue-50' : ''}`}>
            {deleteMode && (
              <button
                type="button"
                onClick={() => {
                  setSelected(prev => {
                    const next = new Set(prev);
                    if (next.has(p.id)) next.delete(p.id); else next.add(p.id);
                    return next;
                  });
                }}
                aria-label={selected.has(p.id) ? 'Seleccionado para borrar' : 'Seleccionar para borrar'}
                className={`absolute top-2 right-2 h-6 w-6 rounded-full border flex items-center justify-center ${selected.has(p.id) ? 'bg-red-600 border-red-600' : 'bg-white border-gray-300 hover:bg-gray-100'}`}
              >
                {!selected.has(p.id) ? (
                  <span className="text-gray-700" style={{ lineHeight: 1, fontWeight: 700 }}>×</span>
                ) : null}
              </button>
            )}
            <div className="flex gap-3">
              {p.imageUrl ? (
                <img alt={p.name} src={p.imageUrl} className="w-20 h-20 object-cover rounded"/>
              ) : p.imageType ? (
                <img alt={p.name} src={`${API}/products/${p.id}/image`} className="w-20 h-20 object-cover rounded"/>
              ) : (
                <div className="w-20 h-20 bg-gray-100 rounded"/>
              )}
              <div>
                <Link href={`/inventario/${p.id}`} className="font-medium hover:underline">{p.name}</Link>
                {p.variants?.[0] && (
                  <div className="text-sm">Precio: {formatCLP(p.variants[0].price)} · Cantidad: {p.variants[0].quantity}</div>
                )}
                {p.type?.name && <div className="text-xs text-gray-600">Tipo: {p.type.name}</div>}
              </div>
            </div>
          </li>
        ))}
      </ul>
      {confirmOpen && (
        <ConfirmModal
          title="Borrar productos"
          message={`¿Seguro que quieres borrar ${selected.size} producto${selected.size>1?'s':''}? Esta acción no se puede deshacer.`}
          confirmLabel={`Sí, borrar`}
          cancelLabel="No"
          onCancel={() => setConfirmOpen(false)}
          onConfirm={async () => {
            setDeleting(true);
            try {
              const ids = Array.from(selected);
              const results = await Promise.all(ids.map(async (id) => {
                const res = await fetchWithAuth(`${API}/products/${id}`, { method: 'DELETE' });
                return { id, ok: res.ok, status: res.status };
              }));
              const failed = results.filter(r => !r.ok);
              if (failed.length) {
                alert(`No se pudieron borrar ${failed.length} producto(s). Código(s): ${failed.map(f=>f.status).join(', ')}`);
              }
              setSelected(new Set());
              setDeleteMode(false);
              await refetch();
            } catch (e) {
              console.error(e);
              alert('Ocurrió un error al borrar.');
            } finally {
              setDeleting(false);
              setConfirmOpen(false);
            }
          }}
        />
      )}
    </main>
  );
}

function ConfirmModal({ title, message, confirmLabel = 'Confirmar', cancelLabel = 'Cancelar', onConfirm, onCancel }: { title: string; message: string; confirmLabel?: string; cancelLabel?: string; onConfirm: () => void | Promise<void>; onCancel: () => void; }) {
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
            <button className="secondary" onClick={onCancel}>{cancelLabel}</button>
            <button className="danger" onClick={onConfirm}>{confirmLabel}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
