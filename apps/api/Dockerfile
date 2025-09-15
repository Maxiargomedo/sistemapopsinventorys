# syntax=docker/dockerfile:1.7

# --- Base deps ---
FROM node:20-alpine AS base
WORKDIR /app
ENV NODE_ENV=production

# --- Build stage ---
FROM base AS build
# Install build tools needed for prisma
RUN apk add --no-cache openssl libc6-compat
COPY package*.json ./
COPY apps/api/package.json ./apps/api/package.json
COPY apps/web/package.json ./apps/web/package.json
COPY packages/shared/package.json ./packages/shared/package.json
RUN npm ci --include=dev
COPY . .
WORKDIR /app/apps/api
RUN npx prisma generate
RUN npm run build

# --- Production runtime ---
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
## Runtime deps for Prisma on Alpine
RUN apk add --no-cache dumb-init openssl libc6-compat ca-certificates netcat-openbsd
# Copy root package manifests for potential workspace resolution (not strictly required)
COPY package*.json ./
COPY apps/api/package.json ./apps/api/package.json

# Copy built API and prisma schema
COPY --from=build /app/apps/api/dist ./dist
COPY --from=build /app/apps/api/prisma ./prisma
COPY --from=build /app/node_modules ./node_modules

# Entrypoint will run migrations then start API
COPY apps/api/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 4000
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["/docker-entrypoint.sh"]
