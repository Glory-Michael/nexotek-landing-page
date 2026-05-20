# Payload MCP Onboarding — Staging

You have access to two things on this project:

1. **Staging Payload admin UI** — `https://nexotek-landing-page-git-staging-michael-xus-projects-ad98bc5d.vercel.app/admin`
2. **Staging Payload MCP server** — `https://nexotek-landing-page-git-staging-michael-xus-projects-ad98bc5d.vercel.app/api/mcp`

The MCP server lets you read/write CMS content (waitlist, media, pages, articles, landing page, site identity, etc.) via JSON-RPC tools instead of clicking through the admin UI. This document gets you connected.

## Prerequisites

Both staging URLs sit behind **Vercel Deployment Protection (SSO)**. You need two secrets:

| Secret | Where to get it | Notes |
| --- | --- | --- |
| **Payload MCP API key** | Already provisioned for you (UUID, looks like `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`) | Bound to your Payload user. Keep it scoped to you — don't share with other agents/devs. |
| **Vercel Protection Bypass** | Team password manager (1Password vault: `nexotek › staging`) | Project-wide, shared by all devs. |

If you ever need to inspect or change your key's permissions (which collections/globals it can `find` / `update`), open the staging admin at `…/admin/collections/payload-mcp-api-keys`, find your row by label, and toggle the sidebar checkboxes. Browser access to admin requires the bypass cookie — visit `…/?x-vercel-protection-bypass=<SECRET>&x-vercel-set-bypass-cookie=true` once first.

## Step 1 — Wire up `.mcp.json`

In the repo root (or wherever your Claude Code workspace lives), create `.mcp.json`:

```json
{
  "mcpServers": {
    "payload-staging": {
      "type": "http",
      "url": "https://nexotek-landing-page-git-staging-michael-xus-projects-ad98bc5d.vercel.app/api/mcp",
      "headers": {
        "Authorization": "Bearer <BEARER_KEY>",
        "x-vercel-protection-bypass": "<VERCEL_BYPASS_SECRET>"
      }
    }
  }
}
```

Or use the CLI:

```bash
claude mcp add --transport http --scope project payload-staging \
  https://nexotek-landing-page-git-staging-michael-xus-projects-ad98bc5d.vercel.app/api/mcp \
  --header "Authorization: Bearer <BEARER_KEY>" \
  --header "x-vercel-protection-bypass: <VERCEL_BYPASS_SECRET>"
```

**Add `.mcp.json` to `.gitignore`.** It contains two secrets — do not commit it.

```bash
echo ".mcp.json" >> .gitignore
```

## Step 2 — Verify the connection

```bash
curl -s -X POST 'https://nexotek-landing-page-git-staging-michael-xus-projects-ad98bc5d.vercel.app/api/mcp' \
  -H "Authorization: Bearer <BEARER_KEY>" \
  -H "x-vercel-protection-bypass: <VERCEL_BYPASS_SECRET>" \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"setup-probe","version":"1.0"}}}'
```

Expected response (HTTP 200):

```
event: message
data: {"result":{"protocolVersion":"2024-11-05","capabilities":{"tools":{"listChanged":true}},"serverInfo":{"name":"NexoTek CMS","version":"1.0.0"}},"jsonrpc":"2.0","id":1}
```

Troubleshooting:
- **HTTP 401 with HTML body** — Vercel SSO is blocking you. Your `x-vercel-protection-bypass` is missing or wrong.
- **HTTP 401 with `{"errors":[{"message":"Unauthorized…"}]}`** — Payload rejected the Bearer key. The key isn't enabled, was rotated, or you typo'd it. Ask the project owner to verify the row in `payload-mcp-api-keys`.
- **HTTP 307** — you accidentally sent `x-vercel-set-bypass-cookie: true`. Drop that header for plain-HTTP MCP clients.

## Step 3 — Restart Claude Code

Project-scoped MCP servers are loaded at session start. Restart Claude Code, then `claude mcp list` should show `payload-staging` as `✓ Connected`.

## What you get

Available tools after connection (subset, with permissions enabled on your key):

- `findWaitlist`, `findMedia`, `findPages`, `findArticles`, `findCategories`, `findEmailLog`, `findUsers`
- `findLandingPage`, `findSiteIdentity`, `findFooter`, `findPressKit`, `findAlphaAccess`, `findNewsroomConfig`
- `updateLandingPage`, `updateSiteIdentity`, `updateFooter`, `updatePressKit`, `updateAlphaAccess`, `updateNewsroomConfig`

Each tool maps to a Payload collection/global. Inputs follow Payload's `find`/`update` query shape (`where`, `limit`, `sort`, `depth`, `select`).

## Security notes

- The Vercel bypass secret grants access to **all** staging preview deployments — treat it like any prod secret.
- Your Payload MCP key authenticates as **your Payload user**. Audit logs will attribute all MCP actions to you.
- If either secret leaks, rotate immediately:
  - **Payload key:** delete & recreate the row in `payload-mcp-api-keys`.
  - **Vercel bypass:** Vercel dashboard → Project → Settings → Deployment Protection → regenerate.
