#!/usr/bin/env sh
set -eu

DB_PATH="${SLATE_DB_PATH:-/app/data/slate.db}"
DB_DIR=$(dirname "$DB_PATH")

mkdir -p "$DB_DIR"

echo "Running database migrations..."
node /app/scripts/migrate.mjs || { echo "Migration failed!"; exit 1; }

echo "Starting application..."
exec "$@"
