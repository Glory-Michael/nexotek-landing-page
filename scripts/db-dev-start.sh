#!/usr/bin/env bash
# Start local dev database and switch .env.local to point at it.
# Usage: npm run db:dev:start

set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# ── 1. Ensure Docker is running ──────────────────────────────────────────────
if ! docker info > /dev/null 2>&1; then
  echo ""
  echo "✗  Docker is not running."
  echo "   Open Docker Desktop, wait for the whale icon to appear in the menu bar, then re-run."
  exit 1
fi

# ── 2. Start the local Postgres container ────────────────────────────────────
echo "→  Starting local Postgres (docker-compose.dev.yml)…"
docker compose -f "$REPO_ROOT/docker-compose.dev.yml" up -d

# Wait until Postgres is ready
echo "→  Waiting for Postgres to accept connections…"
until docker compose -f "$REPO_ROOT/docker-compose.dev.yml" exec -T db \
  pg_isready -U postgres -d nexotek_dev > /dev/null 2>&1; do
  sleep 1
done
echo "   ✓ Postgres is ready."

# ── 3. Back up production .env.local (only if not already backed up) ─────────
if [ ! -f "$REPO_ROOT/.env.local.prod-backup" ]; then
  cp "$REPO_ROOT/.env.local" "$REPO_ROOT/.env.local.prod-backup"
  echo "   ✓ Backed up .env.local → .env.local.prod-backup"
fi

# ── 4. Switch .env.local to local DB ────────────────────────────────────────
cp "$REPO_ROOT/.env.local.dev" "$REPO_ROOT/.env.local"
echo "   ✓ .env.local now points at LOCAL database (localhost:5433/nexotek_dev)"

echo ""
echo "✓  Dev DB is ready. You can now run:"
echo "     npm run dev          — starts Next.js (schema auto-pushes on first start)"
echo "     npm run db:dev:stop  — stop DB and restore production .env.local"
echo ""
echo "  Note: Payload's postgres adapter has push: true, so the dev server"
echo "        auto-applies schema changes. The first 'npm run dev' will print"
echo "        the schema diff and ask y/N to confirm any destructive changes."
echo ""
