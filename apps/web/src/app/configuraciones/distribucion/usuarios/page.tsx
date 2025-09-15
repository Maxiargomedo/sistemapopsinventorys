"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-context";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

type User = { id: string; email: string; fullName: string; role: 'ADMIN'|'VENDEDOR'|'JEFE_LOCAL'; isActive: boolean };

export default function UsuariosPage() {
  const { user, ready, fetchWithAuth } = useAuth();
  const [list, setList] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({ email: '', fullName: '', password: '', confirmPassword: '', role: 'VENDEDOR' as User['role'] });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!ready) return;
    if (!user) { window.location.href = "/login"; return; }
    if (user.role !== 'ADMIN') { window.location.href = "/pos"; return; }
    (async () => {
      try {
        const res = await fetchWithAuth(`${API}/users`);
        const data = await res.json();
        setList(data);
      } catch (e: any) {
        setError(e.message || 'Error al cargar');
      } finally { setLoading(false); }
    })();
  }, [user, ready, fetchWithAuth]);

  async function createUser() {
    setSaving(true); setError(null);
    try {
      const res = await fetchWithAuth(`${API}/users`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (!res.ok) throw new Error('Error al crear');
      const newUser = await res.json();
      setList([newUser, ...list]);
      setForm({ email: '', fullName: '', password: '', confirmPassword: '', role: 'VENDEDOR' });
    } catch (e: any) { setError(e.message || 'Error'); }
    finally { setSaving(false); }
  }

  async function toggleActive(u: User) {
    const res = await fetchWithAuth(`${API}/users/${u.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: !u.isActive }) });
    if (res.ok) {
      setList(list.map(x => x.id === u.id ? { ...x, isActive: !u.isActive } : x));
    }
  }

  async function changeRole(u: User, role: User['role']) {
    const res = await fetchWithAuth(`${API}/users/${u.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role }) });
    if (res.ok) setList(list.map(x => x.id === u.id ? { ...x, role } : x));
  }

  async function remove(u: User) {
    if (!confirm(`¿Eliminar ${u.email}?`)) return;
    const res = await fetchWithAuth(`${API}/users/${u.id}`, { method: 'DELETE' });
    if (res.ok) setList(list.filter(x => x.id !== u.id));
  }

  return (
    <main className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold">Usuarios</h1>

      <section className="mt-6 rounded border bg-white p-4">
        <h2 className="font-medium mb-3">Crear usuario</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <input className="border rounded p-2" placeholder="Correo" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} />
          <input className="border rounded p-2" placeholder="Nombre completo" value={form.fullName} onChange={e=>setForm({...form, fullName:e.target.value})} />
          <input className="border rounded p-2" type="password" placeholder="Contraseña" value={form.password} onChange={e=>setForm({...form, password:e.target.value})} />
          <input className="border rounded p-2" type="password" placeholder="Confirmar contraseña" value={form.confirmPassword} onChange={e=>setForm({...form, confirmPassword:e.target.value})} />
          <select className="border rounded p-2" value={form.role} onChange={e=>setForm({...form, role:e.target.value as any})}>
            <option value="VENDEDOR">VENDEDOR</option>
            <option value="JEFE_LOCAL">JEFE_LOCAL</option>
            <option value="ADMIN">ADMIN</option>
          </select>
        </div>
        <button className="mt-3 px-4 py-2 rounded bg-blue-600 text-white" onClick={createUser} disabled={saving}>
          {saving ? 'Creando...' : 'Crear'}
        </button>
      </section>

      <section className="mt-6">
        {loading && <p>Cargando...</p>}
        {error && <p className="text-red-600">{error}</p>}
        <ul className="grid gap-3">
          {list.map(u => (
            <li key={u.id} className="rounded border bg-white p-4 flex items-center justify-between">
              <div>
                <div className="font-medium">{u.fullName} <span className="text-gray-500">({u.email})</span></div>
                <div className="text-sm">Rol: {u.role} · Estado: {u.isActive ? 'Activo' : 'Inactivo'}</div>
              </div>
              <div className="flex gap-2">
                <select className="border rounded p-2" value={u.role} onChange={e=>changeRole(u, e.target.value as any)}>
                  <option value="VENDEDOR">VENDEDOR</option>
                  <option value="JEFE_LOCAL">JEFE_LOCAL</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
                <button className="px-3 py-2 rounded bg-slate-200" onClick={()=>toggleActive(u)}>{u.isActive ? 'Desactivar' : 'Activar'}</button>
                <button className="px-3 py-2 rounded bg-red-600 text-white" onClick={()=>remove(u)}>Eliminar</button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
