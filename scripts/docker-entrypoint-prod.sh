#!/usr/bin/env sh
set -eu

echo "Running database migrations..."
node /app/scripts/migrate.mjs

echo "Starting application..."
exec "$@"
