# Deployment Guide

How to deploy Loreum to production.

## Infrastructure

| Service     | Provider      | Purpose                         |
| ----------- | ------------- | ------------------------------- |
| Application | TBD           | API + Web + WebSocket gateway   |
| Database    | PostgreSQL 18 | Primary data store              |
| Cache/Queue | Redis 7       | Session cache, BullMQ job queue |
| Storage     | Cloudflare R2 | Images, file uploads            |
| CDN         | Cloudflare    | Static assets, tunnel/proxy     |
| Email       | Resend        | Transactional email             |
| Payments    | Stripe        | Subscriptions, checkout         |
| DNS         | Cloudflare    | loreum.app                      |

## Environment Variables

### Root (Docker Compose)

```env
POSTGRES_USER=
POSTGRES_PASSWORD=
POSTGRES_DB=loreum
REDIS_PASSWORD=
```

### API (`apps/api/.env`)

```env
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_SECRET=
CSRF_SECRET=
# MCP / OAuth: the exact public origins clients use (HTTPS in production)
PUBLIC_API_URL=https://api.loreum.app
WEB_URL=https://loreum.app
BILLING_ENABLED=false
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=
R2_ENDPOINT=
RESEND_API_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

### Web (`apps/web/.env`)

```env
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
```

## Build & Deploy

```sh
# Build all packages
pnpm build

# Run database migrations
pnpm --filter api db:migrate

# Start production
pnpm --filter api start
pnpm --filter web start
```

## CI/CD

The public repository runs CI (lint, test, build) on every pull request via GitHub Actions.

Production deployment is handled by a separate private repository that:

1. Pulls the latest commit from the public repo
2. Builds the Docker images
3. Deploys to the production infrastructure
4. Runs database migrations

This separation keeps deployment secrets and infrastructure config out of the open source codebase.

## Cloudflare and hosted AI clients

claude.ai, Claude Desktop, and ChatGPT reach the API from their own servers, and Cloudflare classifies that traffic as AI bots. With **Block AI training bots / AI Crawl Control** (or Bot Fight Mode) enabled on the zone, Cloudflare answers their authenticated MCP request with 403 at the edge: the OAuth flow completes, the API log shows the token being issued, and then nothing arrives. The connector reports "the integration rejected the credentials it just issued".

Fix in the Cloudflare dashboard: allow AI crawlers for `api.loreum.app`, or add a WAF custom rule with action **Skip** (managed rules and bot protection) for

```
(http.host eq "api.loreum.app" and (starts_with(http.request.uri.path, "/v1/mcp") or starts_with(http.request.uri.path, "/v1/oauth") or starts_with(http.request.uri.path, "/.well-known/")))
```

Security → Events shows the blocked POSTs from Anthropic's range `160.79.104.0/21` if this is the cause. Claude Code and curl are unaffected because they connect from your own machine, which is why the server looks healthy from everywhere except the hosted client.

## Smoke testing the MCP endpoint

After a deploy, confirm discovery and the auth challenge from outside:

```sh
curl -s https://api.loreum.app/.well-known/oauth-authorization-server | jq .issuer
curl -s https://api.loreum.app/.well-known/oauth-protected-resource/v1/mcp/<slug> | jq .resource
curl -si -X POST https://api.loreum.app/v1/mcp/<slug> -H 'content-type: application/json'   -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | grep -i www-authenticate
```

`PUBLIC_API_URL` must equal the origin in those URLs exactly, or claude.ai will reject the metadata. For a full local check, `pnpm --filter api exec tsx scripts/smoke-fixture.ts` prints a project slug and API key you can point any MCP client at.

## Health Checks

```
GET /v1/health
```

Returns status of database, Redis, and R2 connectivity.
