# Sistema de Ventas e Inventario (Monorepo)

Stack: Next.js (web) + NestJS (api) + Prisma + PostgreSQL. Despliegue en Hostinger/Dokploy sin Docker.

## Requisitos
- Node.js >= 18.17
- PostgreSQL (cadena `DATABASE_URL`)

## Estructura
- `apps/web`: Frontend Next.js + Tailwind
- `apps/api`: Backend NestJS + Prisma
- `packages/shared`: Tipos compartidos

## Configuración inicial
1. Crear `.env` en `apps/api` con:
```
DATABASE_URL=postgresql://user:pass@host:5432/dbname?schema=public
PORT=4000
```
2. Instalar dependencias desde la raíz:
```
npm i
npm i -w apps/web
npm i -w apps/api
```
3. Generar cliente Prisma y migrar:
```
npm run -w apps/api prisma:generate
npm run -w apps/api prisma:migrate
```
4. Desarrollo (dos servidores):
```
npm run dev
```
- Web en http://localhost:3000
- API en http://localhost:4000

## Tailwind en web
- Ya configurado con `postcss.config.mjs` y `tailwind.config.ts`.

## Despliegue en Hostinger/Dokploy sin Docker
- Crear dos aplicaciones en Dokploy: `api` (Node) y `web` (Node).
- `api`:
  - Build: `npm i && npm i -w apps/api && npm run -w apps/api prisma:generate && npm run -w apps/api build`
  - Start: `npm run -w apps/api start:prod`
  - Env: `DATABASE_URL`, `PORT`
- `web`:
  - Build: `npm i && npm i -w apps/web && npm run -w apps/web build`
  - Start: `npm run -w apps/web start`

Configura proxy/SSL desde Dokploy/Hostinger, y variables de entorno seguras.
