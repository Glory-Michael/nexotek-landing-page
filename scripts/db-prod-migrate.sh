#!/usr/bin/env bash
# Guided production schema migration checklist.
# Uses Payload migration files (not interactive db:push) for non-destructive,
# repeatable, and auditable schema changes against production.
# Usage: npm run db:prod:migrate

set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

RED='\033[0;31m'
YEL='\033[1;33m'
GRN='\033[0;32m'
BLU='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

confirm() {
  echo ""
  read -r -p "  $1 [y/N] " ans
  [[ "$ans" =~ ^[Yy]$ ]] || { echo "  Aborted."; exit 1; }
}

echo ""
echo -e "${BOLD}╔══════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}║   Production schema migration checklist      ║${NC}"
echo -e "${BOLD}╚══════════════════════════════════════════════╝${NC}"
echo ""

# ── Guard: must NOT be on local DB ─────────────────────────────────────────
CURRENT_DB=$(grep "^DATABASE_URI" "$REPO_ROOT/.env.local" | head -1)
if echo "$CURRENT_DB" | grep -q "localhost\|127.0.0.1"; then
  echo -e "${RED}✗  .env.local is pointing at your LOCAL database.${NC}"
  echo "   Run 'npm run db:dev:stop' first to restore the production .env.local."
  exit 1
fi
echo -e "${GRN}✓  .env.local points at production database${NC}"

# ── Guard: must have an uncommitted or unpushed migration file ───────────────
MIGRATIONS_DIR="$REPO_ROOT/migrations"
if [ ! -d "$MIGRATIONS_DIR" ]; then
  echo ""
  echo -e "${YEL}⚠  No migrations/ directory exists yet.${NC}"
  echo "   You haven't generated a migration file. To do that:"
  echo ""
  echo -e "${BLU}     1. npm run db:dev:start   # point at local DB with old schema${NC}"
  echo -e "${BLU}     2. npm run db:migrate:create  # generates SQL migration file${NC}"
  echo -e "${BLU}     3. Edit the migration file to add data preservation logic${NC}"
  echo -e "${BLU}     4. npm run db:migrate:run  # test it locally${NC}"
  echo -e "${BLU}     5. Commit migrations/ folder${NC}"
  echo ""
  exit 1
fi

# ── Step 1: Backup current data ──────────────────────────────────────────────
echo ""
echo -e "${BOLD}Step 1 — Back up current data via Supabase SQL Editor${NC}"
echo "   Open Supabase Dashboard → SQL Editor and run any backup queries"
echo "   needed to preserve data that the migration would otherwise drop."
echo ""
echo "   For the navbar/footer→navigation migration, run:"
echo ""
echo -e "${YEL}   CREATE TABLE _nav_migration_backup AS"
echo "   SELECT navbar_cta_text AS cta_text, navbar_logo_id AS logo_id,"
echo "          footer_copyright_name AS copyright_name"
echo -e "   FROM landing_page LIMIT 1;${NC}"
confirm "Backup completed and verified in SQL Editor?"

# ── Step 2: Deploy code to Vercel ────────────────────────────────────────────
echo ""
echo -e "${BOLD}Step 2 — Deploy new code to Vercel${NC}"
echo "   The new code (with refactored Navbar/Footer) must be live BEFORE"
echo "   running migrations against prod, so Vercel doesn't error on the"
echo "   currently-deployed old code."
echo ""
echo -e "${BLU}   → git push (or merge a PR)${NC}"
echo -e "${BLU}   → Wait for Vercel deployment to go green${NC}"
confirm "New code is deployed and Vercel deployment is green?"

# ── Step 3: Run migrations against prod ──────────────────────────────────────
echo ""
echo -e "${BOLD}Step 3 — Apply migration to production${NC}"
echo "   Running: npm run db:migrate:run"
echo ""
echo -e "${YEL}   This will execute every pending migration file against the${NC}"
echo -e "${YEL}   production database. There are no interactive prompts.${NC}"
confirm "Apply migrations to production database now?"

npm run db:migrate:run

# ── Step 4: Restore preserved data ───────────────────────────────────────────
echo ""
echo -e "${BOLD}Step 4 — Restore preserved data via Supabase SQL Editor${NC}"
echo "   For the navbar/footer→navigation migration, run:"
echo ""
echo -e "${YEL}   INSERT INTO navigation (cta_text, logo_id, copyright_name,"
echo "                           updated_at, created_at)"
echo "   SELECT cta_text, logo_id, copyright_name, NOW(), NOW()"
echo "   FROM _nav_migration_backup;"
echo ""
echo "   UPDATE navigation_links"
echo "   SET _parent_id = (SELECT id FROM navigation ORDER BY id LIMIT 1);"
echo ""
echo -e "   DROP TABLE _nav_migration_backup;${NC}"
confirm "Data restore SQL run and verified?"

# ── Step 5: Bust cache ───────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}Step 5 — Redeploy on Vercel to bust unstable_cache${NC}"
echo "   The Navbar and Footer cache navigation data. Trigger a redeploy"
echo "   to pick up the newly-restored values."
echo ""
echo -e "${BLU}   → Vercel Dashboard → Deployments → '...' → Redeploy${NC}"
confirm "Redeploy triggered?"

echo ""
echo -e "${GRN}${BOLD}✓  Production migration complete!${NC}"
echo ""
