#!/bin/sh
set -e

# Ensure DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL is not set" >&2
  exit 1
fi

# Run database migrations
npx prisma migrate deploy

# Start the NestJS app
node dist/main.js
