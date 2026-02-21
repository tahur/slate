#!/usr/bin/env sh
set -eu

if [ -z "${DATABASE_URL:-}" ]; then
  echo "[entrypoint] ERROR: DATABASE_URL is required."
  exit 1
fi

# Use dedicated migration URL if available, otherwise runtime URL.
if [ -z "${DATABASE_URL_MIGRATION:-}" ]; then
  export DATABASE_URL_MIGRATION="${DATABASE_URL}"
fi

echo "[entrypoint] Running database migrations..."
node /app/scripts/migrate.mjs || { echo "[entrypoint] Migration FAILED!"; exit 1; }
echo "[entrypoint] Migrations complete."

echo "[entrypoint] Starting application..."
exec "$@"
