import "./globals.css";
import { ReactNode } from "react";
import { Providers } from "@/components/providers";
import { AuthProvider } from "@/components/auth-context";
import Header from "@/components/header";
import { inter } from "./fonts";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" className={inter.variable}>
      <body className="min-h-screen bg-gradient-to-b from-white to-gray-50 text-gray-900 antialiased">
        <AuthProvider>
          <Header />
          <Providers>
            <div className="app-container py-6">
              {children}
            </div>
          </Providers>
        </AuthProvider>
      </body>
    </html>
  );
}
