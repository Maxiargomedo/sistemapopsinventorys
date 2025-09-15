"use client";
import { useAuth } from "@/components/auth-context";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function Header() {
  const { user, logout, ready } = useAuth() as any;
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    if (!ready) return;
    // initialize and tick every second
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, [ready]);
  if (!ready) return null;
  const tz = 'America/Santiago';
  const time = now ? now.toLocaleTimeString('es-CL', { timeZone: tz, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) : '';
  const date = now ? now.toLocaleDateString('es-CL', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }) : '';
  return (
    <header className="sticky top-0 z-20 bg-white/70 backdrop-blur border-b relative">
  <nav className="app-container flex items-center justify-between py-3">
        <div className="flex gap-1 text-sm items-center">
          {user ? (
            <>
              <Link href="/pos" className="px-3 py-1.5 rounded-md hover:bg-gray-100">Punto de venta</Link>
              {(user.role === 'ADMIN' || user.role === 'JEFE_LOCAL') && (
                <>
                  <Link href="/inventario" className="px-3 py-1.5 rounded-md hover:bg-gray-100">Inventario</Link>
                </>
              )}
              {/* New sections */}
              <Link href="/informes" className="px-3 py-1.5 rounded-md hover:bg-gray-100">Informes</Link>
              <Link href="/documentos" className="px-3 py-1.5 rounded-md hover:bg-gray-100">Documentos</Link>
              <Link href="/configuraciones/distribucion" className="px-3 py-1.5 rounded-md hover:bg-gray-100">Distribución</Link>
            </>
          ) : (
            <>
              <Link href="/login" className="px-3 py-1.5 rounded-md hover:bg-gray-100">Iniciar sesión</Link>
              <Link href="/registrarse" className="px-3 py-1.5 rounded-md hover:bg-gray-100">Crear cuenta</Link>
            </>
          )}
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="font-semibold text-brand-700">pop's inventory's</div>
          {user && (
            <>
              <span className="text-gray-700">{user.fullName} · {user.role}</span>
              <button className="px-3 py-1.5 rounded-md bg-gray-100 hover:bg-gray-200" onClick={logout}>Salir</button>
            </>
          )}
        </div>
      </nav>
      {/* Clock anchored to the top-right of the header */}
      <div className="absolute inset-y-0 right-3 hidden sm:flex items-center">
        <div className="flex flex-col items-end text-gray-800 bg-white/70 border rounded-md px-2 py-1 shadow-sm">
          <span className="leading-none font-semibold tabular-nums">{time}</span>
          <span className="leading-none text-[11px] text-gray-600">{date}</span>
        </div>
      </div>
    </header>
  );
}
