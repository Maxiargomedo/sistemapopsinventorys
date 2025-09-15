"use client";
import { useAuth } from "@/components/auth-context";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await login(email, password, remember);
      // read role from whichever storage was used
  // Ir a la pantalla de bienvenida
  router.push('/');
    } catch (err: any) {
      setError(err?.message || "Error al iniciar sesión");
    }
  }

  return (
    <main className="max-w-md mx-auto">
      <h1 className="mb-4">Iniciar sesión</h1>
      <form onSubmit={onSubmit} className="grid gap-3">
        <input placeholder="Correo" type="email" value={email} onChange={(e)=>setEmail(e.target.value)} />
        <div className="relative">
          <input className="w-full pr-20" placeholder="Contraseña" type={show ? 'text' : 'password'} value={password} onChange={(e)=>setPassword(e.target.value)} />
          <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-blue-700" onClick={()=>setShow(s=>!s)}>
            {show ? 'Ocultar' : 'Ver'}
          </button>
        </div>
        <label className="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" checked={remember} onChange={(e)=>setRemember(e.target.checked)} />
          Recordarme
        </label>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <button className="primary">Entrar</button>
      </form>
      <p className="mt-3 text-sm">¿No tienes cuenta? <Link href="/registrarse" className="underline">Crear cuenta pop&apos;s inventory&apos;s</Link></p>
    </main>
  );
}
