# QuestBoard application

This directory contains the QuestBoard Next.js application. For the product overview and full feature list, see the [repository README](../README.md). For module boundaries and data flows, see the [architecture guide](../docs/ARCHITECTURE.md).

## Requirements

- Node.js 22 LTS
- pnpm 10
- Clerk application and webhook
- Neon Postgres database
- Optional Resend, Gemini, and PayMongo accounts for their associated features

## Local setup

```powershell
pnpm install
Copy-Item .env.example .env.local
pnpm db:migrate
pnpm db:check
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). Never commit `.env.local` or `.env.test.local`.

The annotated environment template is [`.env.example`](.env.example). At minimum, normal authenticated database usage needs valid Clerk keys and `DATABASE_URL`.

## External integrations

### Clerk

Configure the public webhook endpoint at `/api/webhooks/clerk` for:

- `user.created`
- `user.updated`
- `user.deleted`

Store its signing secret in `CLERK_WEBHOOK_SIGNING_SECRET`. Clerk owns authentication; the webhook synchronizes Clerk identities into QuestBoard's `users` table.

### Resend and notification cron

Workspace and board invitation delivery needs:

```env
RESEND_API_KEY=
RESEND_FROM_EMAIL=QuestBoard <invites@updates.your-domain.com>
RESEND_REPLY_TO_EMAIL=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

The sender must belong to a verified Resend domain. Optional account notifications use the same sender. Invitation emails remain enabled because recipients need their secure acceptance link.

The daily `/api/cron/notifications` endpoint creates approaching-deadline notifications. Vercel reads its schedule from [`vercel.json`](vercel.json); set `CRON_SECRET` in deployed environments.

### Gemini

AI features use server-only values:

```env
GEMINI_API_KEY=
GEMINI_MODEL=gemini-3.6-flash
```

Do not expose these through `NEXT_PUBLIC_*`. User Pro authorizes board/task generation; Workspace Pro authorizes project summaries.

### PayMongo

QuestBoard uses one-time Checkout Sessions. Configure:

```env
PAYMONGO_SECRET_KEY=
PAYMONGO_WEBHOOK_SECRET=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

The webhook URL is `/api/webhooks/paymongo` and should subscribe to `checkout_session.payment.paid`. Checkout redirects are not the entitlement source of truth: verified webhook fulfillment grants the matching user or workspace 30 days of Pro access.

Keep test keys with test payments and live keys with live payments.

## Database

- Complete schema: [`server/db/schema.ts`](server/db/schema.ts)
- Typed Neon client: [`server/db/client.ts`](server/db/client.ts)
- Drizzle configuration: [`drizzle.config.ts`](drizzle.config.ts)
- Generated migrations: [`drizzle/`](drizzle/)

Commands:

```powershell
pnpm db:generate
pnpm db:migrate
pnpm db:check
pnpm db:studio
```

Database tests require a disposable `TEST_DATABASE_URL` that does not resolve to the same database identity as `DATABASE_URL`.

## Quality and test commands

```powershell
pnpm check
pnpm format:check
pnpm type-check
pnpm test
pnpm test:db
pnpm build
```

Playwright commands:

```powershell
pnpm exec playwright install chromium
pnpm test:e2e
pnpm test:e2e:public
pnpm test:e2e:auth
pnpm test:e2e:ui
```

The authenticated suite requires `E2E_CLERK_USER_EMAIL` for an existing Clerk development user already synchronized to the development Neon database. See [Development setup](../docs/DEVELOPMENT_SETUP.md#playwright-and-clerk-e2e-setup).

## Architecture

```text
app/          Route composition, webhooks, cron, and SSE
components/   Presentational route UI, modals, sidebar, and primitives
controllers/  Client state, optimistic behavior, and Server Action calls
features/     Schemas, DTOs, actions, queries, services, repositories, gateways
server/db/    Neon client and Drizzle schema
tests/        Unit, database integration, and Playwright E2E suites
drizzle/      Generated migration history
```

The primary flows are:

```text
Server page → query → service → repository → database
Client controller → Server Action → service → repository → database
API route → service or gateway
Component → serializable props and callbacks only
```

Board updates are optimistic through Zustand and dnd-kit, then persisted through typed Server Actions. The authenticated SSE route refreshes other clients. Its event hub is currently in-process; multi-instance production deployment needs shared pub/sub.

## Deployment

When importing this repository into Vercel, set `project` as the Root Directory and retain the detected Next.js defaults. Add production-only environment values, migrate the intended production Neon database, configure public webhook URLs, and verify Clerk, PayMongo, Resend, Gemini, and cron behavior after deployment.
