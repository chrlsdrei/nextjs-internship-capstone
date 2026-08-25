# QuestBoard

QuestBoard is an AI-assisted, workspace-based Kanban application for planning projects, coordinating teams, and tracking delivery. It is the full-stack capstone application in this repository and is built with Next.js 16, React 19, Clerk, Neon Postgres, Drizzle ORM, and TypeScript.

The application lives in [`project/`](project/). Repository-level guides and the original assignment material remain in [`docs/`](docs/) and [`tasks/`](tasks/).

## Application highlights

- **Workspace-scoped experience** — switch workspaces from the sidebar and view only the selected workspace's dashboard, projects, team, calendar, and analytics.
- **Workspace governance** — ownership, administrators, members, invitations, ownership transfer, member removal, and voluntary workspace departure.
- **Project access control** — board administrator, editor, and viewer roles with invitations and voluntary board departure.
- **Kanban boards** — sortable lists and task cards powered by dnd-kit, with optimistic Zustand updates and persisted ordering.
- **Task collaboration** — priorities, due dates, multiple assignees, reusable labels, comments, and activity history.
- **Calendar and analytics** — custom events, linked project/task deadlines, project progress, team activity, and a completion-contribution heatmap.
- **Notifications** — in-app alerts for invitations, assignments, comments, and approaching deadlines, plus optional Resend email delivery.
- **AI assistance** — Gemini-powered project-board generation, task breakdown, and persisted board summaries.
- **Pro access** — separate user and workspace Pro tiers fulfilled through verified PayMongo Checkout Session webhooks.
- **Responsive interface** — a QuestBoard-themed ornamental UI, mobile layouts, presence indicators, and an optional reduced-motion mode.

## Technology stack

| Area | Technology |
| --- | --- |
| Framework | Next.js 16.2.11 App Router |
| UI runtime | React and React DOM 19.2.8 |
| Language | TypeScript 5.9.3 |
| Styling | Tailwind CSS 4.3.3 |
| Authentication | Clerk 7 |
| Database | Neon Postgres |
| ORM and migrations | Drizzle ORM 0.45 / Drizzle Kit 0.31 |
| Validation | Zod 4 |
| Client state | Zustand 5 |
| Drag and drop | dnd-kit |
| Calendar | React Big Calendar |
| AI | Google Gemini through `@google/genai` |
| Email | Resend |
| Payments | PayMongo Checkout Sessions |
| Code quality | Biome 2 and TypeScript |
| Testing | Vitest 4 and Playwright |
| Deployment | Vercel |

## Repository structure

```text
nextjs-internship-capstone/
├── project/                  QuestBoard Next.js application
│   ├── app/                  Routes, layouts, webhooks, cron, and SSE
│   ├── components/           Presentational and reusable UI
│   ├── controllers/          Client orchestration and Server Action calls
│   ├── features/             Domain actions, queries, services, and repositories
│   ├── server/db/            Neon client and complete Drizzle schema
│   ├── drizzle/              Generated SQL migrations
│   ├── tests/                Unit, database, and Playwright E2E tests
│   └── public/               QuestBoard brand assets
├── docs/                     Architecture and development guides
├── tasks/                    Original capstone task material
└── README.md                 Repository overview
```

The application follows this dependency direction:

```text
Server page → feature query → service → repository → Neon
Client controller → Server Action → service → repository → Neon
API route → service or external gateway
Presentational component → serializable props and callbacks
```

See [Architecture](docs/ARCHITECTURE.md) for the complete directory and dependency guide.

## Getting started

### Prerequisites

- Node.js 22 LTS
- pnpm 10
- A Clerk application
- A Neon Postgres database or disposable Neon branch
- Optional integrations for the related features: Resend, Gemini, and PayMongo

### Installation

```powershell
git clone https://github.com/YOUR-USERNAME/nextjs-internship-capstone.git
cd nextjs-internship-capstone/project
pnpm install
Copy-Item .env.example .env.local
```

Fill in the required values in `.env.local`, then initialize and verify the database:

```powershell
pnpm db:migrate
pnpm db:check
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

Never commit `.env.local`, `.env.test.local`, API keys, database credentials, or webhook signing secrets.

## Environment configuration

The complete annotated template is [`project/.env.example`](project/.env.example). The primary groups are:

| Integration | Variables |
| --- | --- |
| Clerk | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SIGNING_SECRET` |
| Database | `DATABASE_URL` |
| Database tests | `TEST_DATABASE_URL` |
| Application URLs | `NEXT_PUBLIC_APP_URL` and Clerk route variables |
| Resend | `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, optional `RESEND_REPLY_TO_EMAIL` |
| Deadline cron | `CRON_SECRET` |
| Gemini | `GEMINI_API_KEY`, `GEMINI_MODEL` |
| PayMongo | `PAYMONGO_SECRET_KEY`, `PAYMONGO_WEBHOOK_SECRET` |
| Clerk E2E | `E2E_CLERK_USER_EMAIL` |

Important service endpoints:

- Clerk webhook: `/api/webhooks/clerk`
- PayMongo webhook: `/api/webhooks/paymongo`
- Deadline notification cron: `/api/cron/notifications`
- Authenticated project event stream: `/api/projects/[projectId]/events`

The PayMongo webhook should subscribe to `checkout_session.payment.paid`. Pro access is granted only after a verified webhook fulfills the matching purchase. The current catalog provides 30 days of access per successful checkout: PHP 299 for User Pro and PHP 399 for Workspace Pro.

## Database

The complete database definition is [`project/server/db/schema.ts`](project/server/db/schema.ts). It includes accounts and presence, workspaces and membership, projects and board roles, lists and tasks, assignees, labels, comments, invitations, activity, notifications, rate limits, billing, AI usage, summaries, and calendar events.

Generated migration SQL is stored in [`project/drizzle/`](project/drizzle/).

Useful commands:

```powershell
pnpm db:generate   # Generate a migration after a reviewed schema change
pnpm db:migrate    # Apply pending migrations
pnpm db:check      # Verify connectivity and expected tables
pnpm db:studio     # Inspect the configured database in Drizzle Studio
```

Use `db:push` and development reset scripts only when you understand their impact. Database integration tests must use a disposable `TEST_DATABASE_URL` that is different from `DATABASE_URL`.

## Development commands

Run commands from `project/`:

```powershell
pnpm dev                  # Development server
pnpm build                # Production build
pnpm start                # Start a production build
pnpm check                # Biome lint and format diagnostics
pnpm check:write          # Apply safe Biome fixes
pnpm lint                 # Biome linting
pnpm format               # Format files
pnpm format:check         # Check formatting
pnpm type-check           # TypeScript without emitting files
pnpm test                 # Vitest unit suite
pnpm test:watch           # Vitest watch mode
pnpm test:db              # Isolated Neon integration suite
pnpm test:e2e             # All Playwright flows
pnpm test:e2e:public      # Public and signed-out flows
pnpm test:e2e:auth        # Authenticated Clerk flows
pnpm test:e2e:ui          # Playwright interactive runner
```

Install Playwright's browser once before running E2E tests:

```powershell
pnpm exec playwright install chromium
```

Authenticated E2E tests use an existing Clerk development user named by `E2E_CLERK_USER_EMAIL`. That user must already be synchronized into the development Neon database.

## Authentication and synchronization

Clerk owns credentials, sessions, verification, and account management. QuestBoard stores an application user record linked by Clerk ID. The signed Clerk webhook processes `user.created`, `user.updated`, and `user.deleted` so protected application services can authorize the corresponding database user.

The application does not collect phone numbers during sign-up. Additional sign-up fields should be configured in Clerk and explicitly synchronized only when the application schema and webhook contracts support them.

## AI and subscription model

- **User Pro** unlocks Build with AI and AI Tasks for that user.
- **Workspace Pro** unlocks AI board summaries and increased workspace project/member capacity.
- Entitlements are enforced by server-side services; disabled UI controls are not the security boundary.
- Gemini and PayMongo secret keys are server-only and must never use a `NEXT_PUBLIC_` prefix.
- Generated output is validated with Zod before persistence.

The current implementation uses one-time PayMongo Checkout Sessions rather than recurring provider subscriptions. A successful verified payment changes the relevant user or workspace tier to Pro for 30 days.

## Realtime and scheduled work

Board refresh currently uses an authenticated Server-Sent Events stream backed by an in-process event hub. This works for the current deployment model, but reliable multi-instance realtime requires shared pub/sub infrastructure.

Vercel invokes the protected notification cron daily to materialize deadline reminders. Configure `CRON_SECRET` in the deployed environment.

## Deployment

The intended deployment target is Vercel:

1. Import the repository and set `project` as the Root Directory.
2. Keep the detected Next.js build settings; no custom output directory is required.
3. Add production environment variables without copying local test-only credentials.
4. Apply reviewed migrations to the production Neon database.
5. Configure Clerk and PayMongo webhooks with the production URL.
6. Verify the Resend sending domain and sender address.
7. Deploy, then verify authentication, synchronization, checkout fulfillment, email delivery, and the cron endpoint.

## Documentation

- [Application README](project/README.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Development setup](docs/DEVELOPMENT_SETUP.md)
- [Handbook stack alignment](docs/HANDBOOK_STACK_ALIGNMENT.md)
- [Code review guide](docs/CODE_REVIEW_GUIDE.md)
- [Timeline and milestones](docs/TIMELINE_MILESTONES.md)
- [Original task breakdown](tasks/tasks-capstone-project-management-tool.md)

## Project status

QuestBoard is an implemented educational capstone and portfolio application. Core authentication, workspace governance, project collaboration, Kanban interactions, calendar, analytics, notifications, AI generation, billing checkout, database integration, and automated tests are present. Production use would still require operational hardening such as shared realtime infrastructure, monitoring, backups, and a full security and load review.

## License

This repository is provided for educational use as part of the Stratpoint Engineering Internship Program.
