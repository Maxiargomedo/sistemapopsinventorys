#!/bin/sh
set -e

# Ensure DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL is not set" >&2
  exit 1
fi

# Extract DB host and port from DATABASE_URL
# Examples:
#  postgresql://user:pass@db:5432/dbname?schema=public
DB_HOST=$(echo "$DATABASE_URL" | sed -E 's/.*@([^:\/]+).*/\1/')
DB_PORT=$(echo "$DATABASE_URL" | sed -n 's/.*@[^:\/]*:\([0-9]\+\).*/\1/p')
[ -z "$DB_PORT" ] && DB_PORT=5432

echo "Waiting for database at ${DB_HOST}:${DB_PORT}..."
RETRIES=${DB_RETRIES:-60}
SLEEP=2
COUNT=0
until nc -z "$DB_HOST" "$DB_PORT" 2>/dev/null; do
  COUNT=$((COUNT+1))
  if [ "$COUNT" -ge "$RETRIES" ]; then
    echo "Database not reachable after $((RETRIES*SLEEP))s. Exiting." >&2
    exit 1
  fi
  sleep "$SLEEP"
done
echo "Database is up. Running migrations..."

# Run database migrations
npx prisma migrate deploy

echo "Starting API..."
# Start the NestJS app
node dist/main.js
