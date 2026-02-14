#!/usr/bin/env sh
set -eu

DB_PATH="${SLATE_DB_PATH:-/app/data/slate.db}"
DB_DIR=$(dirname "$DB_PATH")

mkdir -p "$DB_DIR"


# Restore form Litestream if configured
if [ -n "${LITESTREAM_REPLICA_URL:-}" ]; then
  if [ ! -f "$DB_PATH" ]; then
    echo "Restoring database from ${LITESTREAM_REPLICA_URL}..."
    # -if-replica-exists prevents failure on fresh install
    litestream restore -v -if-replica-exists -o "$DB_PATH" "${LITESTREAM_REPLICA_URL}" || echo "No replica found, starting fresh."
  fi
fi

echo "Running database migrations..."
node /app/scripts/migrate.mjs || { echo "Migration failed!"; exit 1; }

echo "Starting application..."

if [ -n "${LITESTREAM_REPLICA_URL:-}" ]; then
  # Wrap command with Litestream
  # We use "$*" to join arguments into a single string for -exec
  exec litestream replicate -config /etc/litestream.yml -exec "$*"
else
  exec "$@"
fi
