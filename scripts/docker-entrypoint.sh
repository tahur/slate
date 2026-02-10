#!/usr/bin/env sh
set -eu

DB_PATH="${OPENBILL_DB_PATH:-data/openbill.db}"
DB_DIR=$(dirname "$DB_PATH")

mkdir -p "$DB_DIR"

if [ "${FRESH_DB:-0}" = "1" ]; then
  rm -f "$DB_PATH" "${DB_PATH}-wal" "${DB_PATH}-shm"
fi

npm run db:push

exec "$@"
