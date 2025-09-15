"use client";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

type User = { id: string; email: string; fullName: string; role: "ADMIN"|"VENDEDOR"|"JEFE_LOCAL" };
type AuthState = { token: string | null; user: User | null };

const AuthCtx = createContext<{
  token: string | null;
  user: User | null;
  ready: boolean;
  login: (email: string, password: string, remember?: boolean) => Promise<void>;
  register: (data: { email: string; password: string; confirmPassword: string; fullName: string }) => Promise<void>;
  logout: () => void;
  fetchWithAuth: (input: RequestInfo, init?: RequestInit) => Promise<Response>;
}>({ token: null, user: null, ready: false, async login() {}, async register() {}, logout() {}, fetchWithAuth: fetch });

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Estado inicial neutro para que SSR y primer render cliente coincidan
  const [state, setState] = useState<AuthState>({ token: null, user: null });
  const [ready, setReady] = useState(false);
  const INACTIVITY_MS = 6 * 60 * 60 * 1000; // 6 horas

  useEffect(() => {
    // Cargar sesión desde storage al montar en el cliente
    try {
      const storagePref = localStorage.getItem('auth_storage');
      let raw: string | null = null;
      if (storagePref === 'local') raw = localStorage.getItem('auth');
      else if (storagePref === 'session') raw = sessionStorage.getItem('auth');
      else raw = sessionStorage.getItem('auth') || localStorage.getItem('auth');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.token && parsed?.user) setState({ token: parsed.token, user: parsed.user });
      }
    } catch {}
    setReady(true);
    // Listener para actividad del usuario
    const bump = () => {
      try { if (typeof window !== 'undefined') localStorage.setItem('lastActivity', Date.now().toString()); } catch {}
    };
    window.addEventListener('mousemove', bump);
    window.addEventListener('keydown', bump);
    window.addEventListener('click', bump);
    bump();
    // Chequeo periódico de inactividad
    const iv = window.setInterval(() => {
      try {
        const ts = Number(localStorage.getItem('lastActivity') || '0');
        if (ts && Date.now() - ts > INACTIVITY_MS) {
          logout();
          window.location.href = '/login';
        }
      } catch {}
    }, 60 * 1000);
    return () => {
      window.clearInterval(iv);
      window.removeEventListener('mousemove', bump);
      window.removeEventListener('keydown', bump);
      window.removeEventListener('click', bump);
    };
  }, []);

  // Mantener en sync el storage donde se guardó la sesión
  useEffect(() => {
    if (typeof window === "undefined") return;
    const target = localStorage.getItem('auth_storage') || (sessionStorage.getItem("auth") ? "session" : (localStorage.getItem("auth") ? "local" : null));
    if (!target) return;
    const payload = JSON.stringify({ token: state.token, user: state.user });
    if (target === "session") sessionStorage.setItem("auth", payload);
    else localStorage.setItem("auth", payload);
  }, [state.token, state.user]);

  async function login(email: string, password: string, remember?: boolean) {
    const res = await fetch(`${API}/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
    if (!res.ok) throw new Error("Credenciales inválidas");
    const data = await res.json();
    setState({ token: data.access_token, user: data.user });
    if (typeof window !== "undefined") {
      const payload = JSON.stringify({ token: data.access_token, user: data.user });
      if (remember) {
        localStorage.setItem("auth", payload);
        localStorage.setItem('auth_storage', 'local');
        sessionStorage.removeItem("auth");
      } else {
        sessionStorage.setItem("auth", payload);
        localStorage.setItem('auth_storage', 'session');
        localStorage.removeItem("auth");
      }
      try { localStorage.setItem('lastActivity', Date.now().toString()); } catch {}
    }
  }

  async function register(data: { email: string; password: string; confirmPassword: string; fullName: string }) {
    const res = await fetch(`${API}/auth/register`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    if (!res.ok) throw new Error("No se pudo registrar");
  }

  async function fetchWithAuth(input: RequestInfo, init?: RequestInit) {
    const headers = new Headers(init?.headers || {});
    if (state.token) headers.set("Authorization", `Bearer ${state.token}`);
    const res = await fetch(input, { ...init, headers });
    try { if (typeof window !== 'undefined') localStorage.setItem('lastActivity', Date.now().toString()); } catch {}
    if (res.status === 401) {
      // sesión expirada o inválida
      logout();
      if (typeof window !== 'undefined') window.location.href = '/login';
    }
    return res;
  }

  function logout() {
    setState({ token: null, user: null });
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("auth");
      localStorage.removeItem("auth");
      localStorage.removeItem('auth_storage');
      try { localStorage.removeItem('lastActivity'); } catch {}
    }
  }

  const value = useMemo(() => ({ token: state.token, user: state.user, ready, login, register, logout, fetchWithAuth }), [state, ready]);
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() { return useContext(AuthCtx); }
