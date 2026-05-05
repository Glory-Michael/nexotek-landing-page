#!/usr/bin/env bash
# Stop local dev database and restore production .env.local.
# Usage: npm run db:dev:stop

set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# ── 1. Restore production .env.local ────────────────────────────────────────
if [ -f "$REPO_ROOT/.env.local.prod-backup" ]; then
  cp "$REPO_ROOT/.env.local.prod-backup" "$REPO_ROOT/.env.local"
  echo "✓  .env.local restored to PRODUCTION database"
else
  echo "⚠  No .env.local.prod-backup found — .env.local unchanged"
fi

# ── 2. Stop the local Postgres container ─────────────────────────────────────
if docker info > /dev/null 2>&1; then
  echo "→  Stopping local Postgres…"
  docker compose -f "$REPO_ROOT/docker-compose.dev.yml" down
  echo "✓  Local Postgres stopped (data volume preserved for next time)"
else
  echo "⚠  Docker is not running — container already stopped"
fi

echo ""
echo "✓  Back to production. Run 'npm run dev' to develop against the production DB."
echo ""
