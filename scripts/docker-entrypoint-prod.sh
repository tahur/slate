#!/usr/bin/env sh
set -eu

node scripts/migrate.mjs

exec "$@"
