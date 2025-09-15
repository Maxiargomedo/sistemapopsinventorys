"use client";
import { useAuth } from "@/components/auth-context";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "", confirmPassword: "", fullName: "" });
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await register(form);
      router.push('/login');
    } catch (err: any) {
      setError(err?.message || "No se pudo registrar");
    }
  }

  return (
    <main className="max-w-md mx-auto">
      <h1 className="mb-4">Crear cuenta pop&apos;s inventory&apos;s</h1>
      <form onSubmit={onSubmit} className="grid gap-3">
        <input placeholder="Nombre completo" value={form.fullName} onChange={(e)=>setForm({...form, fullName: e.target.value})} />
        <input placeholder="Correo" type="email" value={form.email} onChange={(e)=>setForm({...form, email: e.target.value})} />
        <input placeholder="Contraseña" type="password" value={form.password} onChange={(e)=>setForm({...form, password: e.target.value})} />
        <input placeholder="Confirmar contraseña" type="password" value={form.confirmPassword} onChange={(e)=>setForm({...form, confirmPassword: e.target.value})} />
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <button className="primary">Crear cuenta</button>
      </form>
      <p className="mt-3 text-sm">¿Ya tienes cuenta? <a href="/login" className="underline">Iniciar sesión</a></p>
    </main>
  );
}
