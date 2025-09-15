"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-context";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

type Product = {
  id: string;
  name: string;
  variants: { id: string; name: string; price: string }[];
};

export default function AdminProductsPage() {
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: "", price: "", category: "" });
  const [editing, setEditing] = useState<null | Product>(null);
  const { fetchWithAuth, user, ready } = useAuth();

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

  const { data, isLoading, error } = useQuery<Product[]>({
    queryKey: ["admin-products"],
    queryFn: async () => (await fetch(`${API}/products`)).json(),
  });

  const createMut = useMutation({
    mutationFn: async () => {
      const body = { name: form.name, price: Number(form.price), category: form.category };
      const res = await fetchWithAuth(`${API}/products`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error("Error al crear");
      return res.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-products"] }); setForm({ name: "", price: "", category: "" }); },
  });

  const updateMut = useMutation({
    mutationFn: async (payload: { id: string; name?: string; price?: number }) => {
      const res = await fetchWithAuth(`${API}/products/${payload.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: payload.name, price: payload.price }) });
      if (!res.ok) throw new Error("Error al actualizar");
      return res.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-products"] }); setEditing(null); },
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetchWithAuth(`${API}/products/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error al eliminar");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-products"] }),
  });

  return (
    <main className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold">Admin · Productos</h1>

      {/* Crear */}
      <section className="mt-6 rounded border bg-white p-4">
        <h2 className="font-medium mb-3">Crear producto</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <input className="border rounded p-2" placeholder="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="border rounded p-2" placeholder="Precio" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          <input className="border rounded p-2" placeholder="Categoría" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
        </div>
        <button className="mt-3 px-4 py-2 rounded bg-blue-600 text-white" onClick={() => createMut.mutate()} disabled={createMut.isPending}>
          {createMut.isPending ? "Creando..." : "Crear"}
        </button>
      </section>

      {/* Listado */}
      <section className="mt-6">
        {isLoading && <p>Cargando...</p>}
        {error && <p className="text-red-600">Error al cargar</p>}
        <ul className="grid gap-3">
          {Array.isArray(data) && data.map((p) => (
            <li key={p.id} className="rounded border bg-white p-4">
              {editing?.id === p.id ? (
                <div className="grid gap-2 sm:grid-cols-3">
                  <input className="border rounded p-2" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
                  <input className="border rounded p-2" type="number" value={editing.variants?.[0]?.price ?? "0"} onChange={(e) => setEditing({ ...editing, variants: [{ ...(editing.variants?.[0] || { id: "", name: "Único", price: "0" }), price: e.target.value }] })} />
                  <div className="flex gap-2">
                    <button className="px-3 py-2 rounded bg-green-600 text-white" onClick={() => updateMut.mutate({ id: p.id, name: editing.name, price: Number(editing.variants?.[0]?.price ?? 0) })}>Guardar</button>
                    <button className="px-3 py-2 rounded bg-slate-200" onClick={() => setEditing(null)}>Cancelar</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{p.name}</div>
                    {p.variants?.[0] && <div className="text-sm">Precio: ${p.variants[0].price}</div>}
                  </div>
                  <div className="flex gap-2">
                    <button className="px-3 py-2 rounded bg-slate-200" onClick={() => setEditing(p)}>Editar</button>
                    <button className="px-3 py-2 rounded bg-red-600 text-white" onClick={() => deleteMut.mutate(p.id)}>Eliminar</button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
