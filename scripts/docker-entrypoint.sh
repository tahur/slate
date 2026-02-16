#!/usr/bin/env sh
set -eu

DB_PATH="${SLATE_DB_PATH:-/app/data/slate.db}"
DB_DIR=$(dirname "$DB_PATH")

mkdir -p "$DB_DIR"

# Restore from Litestream if configured
if [ -n "${LITESTREAM_REPLICA_URL:-}" ]; then
  echo "[entrypoint] Litestream replica URL configured: ${LITESTREAM_REPLICA_URL}"

  # Always attempt restore if DB doesn't exist
  if [ ! -f "$DB_PATH" ]; then
    echo "[entrypoint] No database found at ${DB_PATH}, attempting restore..."
    # Capture stderr for debugging restore failures
    RESTORE_OUTPUT=$(litestream restore -v -if-replica-exists -o "$DB_PATH" "${LITESTREAM_REPLICA_URL}" 2>&1) && RESTORE_OK=true || RESTORE_OK=false
    echo "$RESTORE_OUTPUT"

    if [ "$RESTORE_OK" = "true" ] && [ -f "$DB_PATH" ]; then
      DB_SIZE=$(stat -c%s "$DB_PATH" 2>/dev/null || stat -f%z "$DB_PATH" 2>/dev/null || echo "unknown")
      echo "[entrypoint] Restore SUCCESS — database size: ${DB_SIZE} bytes"
    elif [ "$RESTORE_OK" = "true" ]; then
      echo "[entrypoint] Restore completed but no database file created (no replica exists yet). Starting fresh."
    else
      echo "[entrypoint] ⚠️  Restore FAILED. Output above may contain the reason."
      echo "[entrypoint] Starting with empty database."
    fi
  else
    DB_SIZE=$(stat -c%s "$DB_PATH" 2>/dev/null || stat -f%z "$DB_PATH" 2>/dev/null || echo "unknown")
    echo "[entrypoint] Database already exists at ${DB_PATH} (${DB_SIZE} bytes), skipping restore."
  fi
else
  echo "[entrypoint] No LITESTREAM_REPLICA_URL set, using local storage only."
fi

echo "[entrypoint] Running database migrations..."
node /app/scripts/migrate.mjs || { echo "[entrypoint] Migration FAILED!"; exit 1; }
echo "[entrypoint] Migrations complete."

echo "[entrypoint] Starting application..."

if [ -n "${LITESTREAM_REPLICA_URL:-}" ]; then
  # Generate litestream config at runtime (env var substitution)
  cat > /tmp/litestream.yml <<EOF
dbs:
  - path: ${DB_PATH}
    replicas:
      - url: ${LITESTREAM_REPLICA_URL}
EOF
  exec litestream replicate -config /tmp/litestream.yml -exec "$*"
else
  exec "$@"
fi
