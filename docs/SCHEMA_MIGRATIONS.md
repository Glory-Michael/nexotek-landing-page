# Schema Migrations & Local Development

This document covers the safe workflow for changing Payload CMS globals/collections and deploying those changes to production without disrupting the live site.

> **TL;DR:** Always test schema changes against a local Postgres first (`npm run db:dev:start`). Only touch production via the guided `npm run db:prod:migrate` flow.

---

## Architecture context

- **CMS:** Payload 3.x with the `@payloadcms/db-postgres` adapter
- **Database:** Supabase Postgres (production) + local Postgres in Docker (dev)
- **Push mode:** `push: true` is set on the postgres adapter, so the dev server (`npm run dev`) auto-applies schema diffs interactively
- **Module system:** `package.json` has `"type": "module"` — this is required for Payload CLI commands to load `.ts` config under Node 24+ tsx

---

## NPM scripts

| Script | Purpose |
|---|---|
| `npm run db:dev:start` | Start local Postgres (Docker) + swap `.env.local` to point at it |
| `npm run db:dev:stop` | Stop local Postgres + restore production `.env.local` |
| `npm run dev` | Next.js dev server (auto-pushes schema if changed) |
| `npm run db:migrate:create` | Generate a SQL migration file from current code/DB diff |
| `npm run db:migrate:run` | Apply pending migration files to whatever DB `.env.local` points at |
| `npm run db:migrate:status` | Show which migrations have been applied |
| `npm run db:prod:migrate` | Guided checklist for production schema changes |

---

## Files involved in the dev pipeline

```
docker-compose.dev.yml           — local Postgres on port 5433
.env.local.dev                   — full env file with DATABASE_URI swapped to local
.env.local.prod-backup           — auto-created backup of production env (gitignored)
scripts/db-dev-start.sh          — starts Docker + swaps .env.local
scripts/db-dev-stop.sh           — stops Docker + restores .env.local
scripts/db-prod-migrate.sh       — guided production migration checklist
migrations/                      — Payload-generated SQL migration files (commit these)
```

---

## Workflow 1 — Local schema testing

Use this whenever you change a Payload global, collection, or field definition.

```bash
# 1. Start the local DB and switch env
npm run db:dev:start

# 2. Start Next.js — first run will prompt to create tables / accept changes
npm run dev
```

When `npm run dev` starts, Payload diffs your code against the local DB schema and prompts to apply changes. The local DB is empty on first run, so you'll see a series of `+ create table` confirmations — accept all with `y`.

```bash
# 3. Open http://localhost:3000/admin
#    - Create a local admin user (one-time, throwaway)
#    - Populate the changed globals with test data
#    - Click through the affected pages (landing, newsroom, event slug, etc.)

# 4. When done
# Ctrl+C the dev server, then:
npm run db:dev:stop
```

`.env.local` is now restored to production. Your local Docker volume persists, so the next `db:dev:start` brings up the same DB instantly.

---

## Workflow 2 — Production migration

> **Pre-requisites:**
> - Local validation (Workflow 1) passed
> - Code is committed and pushed to git
> - Vercel deployment of the new code is **green**

The production migration uses **migration files** (not interactive `db:push`) because production has no TTY for prompts.

### Step 1 — Generate a migration file (locally)

```bash
# Make sure local DB has the OLD schema (matches production state)
# If your local DB already has new schema, reset it:
docker compose -f docker-compose.dev.yml down -v   # destroys local data
npm run db:dev:start

# Now generate the migration capturing the diff
npm run db:migrate:create
```

This creates a file in `migrations/` with the SQL needed to go from old schema → new schema. **Inspect the file** — it will contain `CREATE TABLE`, `ALTER TABLE`, and possibly `DROP COLUMN` statements.

If the migration drops columns that hold data you need to preserve, **edit the migration file** to add `INSERT INTO ... SELECT ...` or temporary backup table logic *before* the destructive statements.

### Step 2 — Test the migration locally

```bash
# Apply the migration file to local DB
npm run db:migrate:run

# Restart dev server to verify
npm run dev
```

### Step 3 — Commit the migration

```bash
git add migrations/
git commit -m "db: migrate <description>"
git push
```

Wait for Vercel to deploy successfully.

### Step 4 — Run the guided prod migration

```bash
npm run db:dev:stop      # ensure .env.local points at production
npm run db:prod:migrate  # interactive checklist
```

The checklist walks through:
1. Backup any data the migration would drop (run SQL in Supabase SQL Editor)
2. Confirm new code is deployed to Vercel
3. Run `payload migrate` against production
4. Restore preserved data via Supabase SQL Editor
5. Trigger a Vercel redeploy to bust the `unstable_cache`

---

## Common scenarios

### Adding a new field to an existing global

1. `npm run db:dev:start`
2. Edit `globals/<Name>.ts` to add the field
3. `npm run dev` — Payload prompts to add the column. Accept.
4. Test in admin
5. `npm run db:dev:stop`
6. `npm run db:migrate:create` (with old-schema local DB) → commit → deploy → `npm run db:prod:migrate`

For purely additive changes (new column, new table), the migration is data-safe and can be applied directly without backup SQL.

### Removing or renaming a field that has production data

This is the destructive case. Always:
1. Backup the data column first (Supabase SQL Editor)
2. Run the schema migration
3. Restore data into the new column/table
4. Drop the backup table

The `db:prod:migrate` script reminds you about backup SQL at each step.

### Moving fields between globals (like Navbar/Footer → Navigation)

Same as "removing a field" but the restore SQL inserts into a different table. See git history of `scripts/db-prod-migrate.sh` for the original navbar/footer migration as a worked example.

---

## Troubleshooting

### `Error [ERR_MODULE_NOT_FOUND]: Cannot find module '.../collections/Users'` when running `npx payload`

The project must have `"type": "module"` in `package.json`. Verify:
```bash
grep '"type"' package.json
# Should print:  "type": "module",
```

### `next/cache` not found / CommonJS errors

Don't pass `--use-swc` to payload commands. The default tsx loader works fine with `"type": "module"`.

### Dev server starts but doesn't prompt to push schema

The schema is already in sync — your code matches the local DB. To force a re-prompt, change a field in code or reset the local DB:
```bash
docker compose -f docker-compose.dev.yml down -v
npm run db:dev:start
npm run dev
```

### Local admin login doesn't work after `db:dev:start`

The local DB is separate from production — production users don't exist locally. The first `npm run dev` against an empty local DB prompts you to create a new local admin. This admin is throwaway (only in Docker volume).

### Production site shows default Navbar/Footer values briefly after deploy

This happens during the window between deploying new code and running the data restore SQL. The `getNavbarData`/`getFooterData` functions catch the "table doesn't exist" error and fall back to `navigationDefaults`. To minimize the window, have backup + restore SQL queries ready in Supabase SQL Editor tabs before deploying.

### `npm run dev` says schema is locked or migration failed mid-run

Connect to local DB directly and check:
```bash
docker compose -f docker-compose.dev.yml exec db psql -U postgres -d nexotek_dev
```
Run `\dt` to inspect tables. If something is in a broken state, nuking the volume with `down -v` is the fastest way out (local data loss only).

---

## Why this workflow exists

Production `.env.local` points at the live Supabase database. Running `npm run dev` (which has `push: true`) directly against production would:
- Apply schema changes immediately, dropping columns the deployed code still expects → broken site
- Fail on destructive operations because Vercel/CI has no TTY for prompts
- Lose data that lives in dropped columns

The local-first workflow guarantees:
- Schema changes are previewed and validated before any production touch
- Migration files are auditable, repeatable, and committed to source
- Production data has explicit backup + restore steps, not assumptions
