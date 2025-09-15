"use client";
import { useEffect } from "react";
import { useAuth } from "@/components/auth-context";

export default function ConfigPage() {
  const { user, ready } = useAuth();
  useEffect(() => {
    if (!ready) return;
    if (!user) { window.location.href = "/login"; return; }
    // Later: restrict to ADMIN for system-wide settings; for now allow authenticated access
  }, [user, ready]);

  return (
    <main className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-semibold">Configuraciones</h1>
      <p className="mt-2 text-gray-600">Próximamente: configuración de empresa, impuestos, series de documentos, impresoras, etc.</p>
    </main>
  );
}
