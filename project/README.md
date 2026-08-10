# ProjectFlow

ProjectFlow is a collaborative Kanban project-management application built with Next.js 16, React 19, Clerk, Neon Postgres, Drizzle ORM, Tailwind CSS 4, Zod, Zustand, and dnd-kit.

Implemented capabilities include:

- Clerk authentication and protected application routes.
- Clerk user synchronization through a signed webhook.
- Database-backed projects and role-based project membership.
- Lists and tasks with validation, authorization, ordering, and optimistic drag-and-drop.
- Authenticated Server-Sent Events for local board refresh.
- Responsive light and dark interfaces.

See the [architecture guide](../docs/ARCHITECTURE.md) for the directory map, dependency boundaries, data flows, and the process for adding a feature. See [development setup](../docs/DEVELOPMENT_SETUP.md) for local environment and service configuration.

## Requirements

- Node.js 22 LTS
- pnpm 10
- A Clerk application
- A Neon Postgres database

## Local setup

```powershell
pnpm install
Copy-Item .env.example .env.local
pnpm db:migrate
pnpm db:check
pnpm dev
```

Configure the values described in `.env.example`. Never commit `.env.local`.

The Clerk webhook endpoint is `/api/webhooks/clerk` and subscribes to `user.created`, `user.updated`, and `user.deleted`. For local webhook delivery, expose the application using a trusted tunnel and configure `CLERK_WEBHOOK_SIGNING_SECRET`.

Workspace and board invitation delivery uses Resend. Configure `RESEND_API_KEY`, a verified `RESEND_FROM_EMAIL`, and `NEXT_PUBLIC_APP_URL`; invitation links expire after seven days, are single-use, and are matched to the signed-in user's verified primary Clerk email.

## Commands

```powershell
pnpm dev
pnpm build
pnpm check
pnpm check:write
pnpm lint
pnpm format
pnpm format:check
pnpm type-check
pnpm db:generate
pnpm db:migrate
pnpm db:push
pnpm db:studio
pnpm db:check
```

Biome provides linting and formatting. Drizzle migrations are generated under `drizzle/`.

## Realtime limitation

Board events currently use an in-memory, single-process event hub. Reconnects reconcile through an SSE sync event, but a multi-instance production deployment needs shared pub/sub infrastructure.

Vitest unit tests and isolated Neon integration tests are available through `pnpm test` and `pnpm test:db`. Database tests require a disposable `TEST_DATABASE_URL` that differs from `DATABASE_URL`.
