# syntax=docker/dockerfile:1.7

# --- Base ---
FROM node:20-alpine AS base
WORKDIR /app
ENV NODE_ENV=production

# --- Dependencies ---
FROM base AS deps
COPY package*.json ./
COPY apps/web/package.json ./apps/web/package.json
COPY apps/api/package.json ./apps/api/package.json
COPY packages/shared/package.json ./packages/shared/package.json
RUN npm ci --include=dev

# --- Build ---
FROM deps AS build
COPY . .
WORKDIR /app/apps/web
# Build Next.js app (standalone output)
RUN npm run build

# --- Runtime ---
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
# Next standalone requires only .next/standalone and .next/static
COPY --from=build /app/apps/web/.next/standalone .
COPY --from=build /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build /app/apps/web/public ./apps/web/public
ENV PORT=3000
EXPOSE 3000
# Next standalone entry point
CMD ["node", "apps/web/server.js"]
