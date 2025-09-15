"use client";
import { useEffect } from "react";
import { useAuth } from "@/components/auth-context";
import { useRouter } from "next/navigation";

export default function AdminIndex() {
  const { user, ready } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    if (!user) { router.replace('/login'); return; }
    if (user.role !== 'ADMIN' && user.role !== 'JEFE_LOCAL') { router.replace('/pos'); return; }
    router.replace('/admin/products');
  }, [ready, user, router]);

  return null;
}
