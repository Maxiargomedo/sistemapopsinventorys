"use client";
import { useAuth } from "@/components/auth-context";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect } from "react";

export default function HomePage() {
  const { user, ready } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!ready) return;
    if (!user) router.replace('/login');
  }, [ready, user, router]);
  if (!ready) return null;
  if (!user) return null;
  return (
    <main>
      <div className="card p-6">
        <h1>Bienvenido {user.fullName}</h1>
        <p className="text-gray-700 mt-1">Selecciona alguna acción.</p>
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link href="/pos" className="card p-4 hover:shadow-md transition-shadow">
            <div className="font-medium">Punto de venta</div>
            <div className="text-sm text-gray-600">Cobrar y emitir comprobantes</div>
          </Link>
          <Link href="/documentos" className="card p-4 hover:shadow-md transition-shadow">
            <div className="font-medium">Documentos</div>
            <div className="text-sm text-gray-600">Reimpresión y facturas de compra</div>
          </Link>
          {(user.role === 'ADMIN' || user.role === 'JEFE_LOCAL') && (
            <Link href="/inventario" className="card p-4 hover:shadow-md transition-shadow">
              <div className="font-medium">Inventario</div>
              <div className="text-sm text-gray-600">Productos, precios y stock</div>
            </Link>
          )}
          <Link href="/informes" className="card p-4 hover:shadow-md transition-shadow">
            <div className="font-medium">Informes</div>
            <div className="text-sm text-gray-600">Ventas del día y rangos</div>
          </Link>
          {user.role === 'ADMIN' && (
            <Link href="/configuraciones/distribucion" className="card p-4 hover:shadow-md transition-shadow">
              <div className="font-medium">Configuración</div>
              <div className="text-sm text-gray-600">Distribución y ajustes</div>
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}
