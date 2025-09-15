"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/auth-context";
import { useRouter } from "next/navigation";

export default function DistribucionIndex() {
  const { user, ready } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!ready) return;
    if (!user) { window.location.href = "/login"; return; }
    // Only ADMIN can access distribution settings (users + config)
    if (user.role !== 'ADMIN') { window.location.href = "/pos"; }
  }, [user, ready]);

  // Cerrar al hacer click fuera o al presionar Esc
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false); }
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onClick); document.removeEventListener('keydown', onKey); };
  }, []);

  return (
    <main className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold">Distribución</h1>
      <div className="mt-4 relative" ref={menuRef}>
        <button
          type="button"
          className="inline-flex items-center gap-2 border rounded px-4 py-2 bg-white hover:bg-gray-50 shadow-sm"
          onClick={() => setOpen(o => !o)}
          aria-expanded={open}
          aria-haspopup="menu"
        >
          Seleccionar opción
          <span className="text-gray-500">▾</span>
        </button>

        {open && (
          <div
            role="menu"
            className="absolute z-20 mt-2 w-80 rounded border bg-white/90 backdrop-blur shadow-xl overflow-hidden"
          >
            <div className="px-4 py-3 text-sm font-medium text-gray-700 border-b flex items-center justify-between">
              Distribución
              <span className="text-gray-400 text-xs">Opciones</span>
            </div>
            <ul className="p-2 text-sm">
              <li>
                <button
                  className="w-full text-left rounded px-3 py-2 hover:bg-gray-100"
                  onClick={() => { setOpen(false); router.push('/configuraciones/distribucion/usuarios'); }}
                >
                  Usuarios
                </button>
              </li>
              <li>
                <button
                  className="w-full text-left rounded px-3 py-2 hover:bg-gray-100"
                  onClick={() => { setOpen(false); router.push('/configuraciones/distribucion/configuracion'); }}
                >
                  Configuración
                </button>
              </li>
            </ul>
          </div>
        )}
      </div>
    </main>
  );
}
