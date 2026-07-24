# Repo Tech Stack vs This Handbook — What to Upgrade

The repository was initialized in February 2026. The table below compares its original stack with the handbook standard and identifies the changes required for this project.

Stable, compatible releases should be used when applying the handbook. Outdated handbook version labels should not force the project onto deprecated packages or prerelease majors.

| Tool | In Repo | Handbook Target | Action Required |
|---|---|---|---|
| Next.js | 16.1.6 | Latest compatible Next.js 16 | Upgrade within the supported Next.js 16 major and verify integrations |
| React / React DOM | 19 | React 19 | Retain React 19 and apply compatible patch upgrades with Next.js |
| TypeScript | 5.9 | 5.5+ | No major-version upgrade required; the repository exceeds the handbook minimum |
| Tailwind CSS | 3.3 with `tailwind.config.js` | Tailwind CSS 4, CSS-first | Upgrade to Tailwind 4, use `@tailwindcss/postcss`, and move theme configuration into `globals.css` |
| Authentication | Clerk planned | Current stable Clerk | Use Clerk with the Next.js App Router; do not downgrade to the handbook's older Clerk v6 reference |
| ORM | Drizzle ORM | Current stable Drizzle ORM and Drizzle Kit | Upgrade to current stable packages and verify generation and migration syntax; do not use prerelease majors solely because the handbook says “v2” |
| Database driver | Neon serverless | Current stable Neon serverless | Use the Neon serverless driver with Drizzle's Neon HTTP adapter |
| Validation | Planned | Current stable Zod | Use Zod for server-boundary and form payload validation |
| State | Zustand planned | Zustand and React `useOptimistic()` | Defer Zustand installation until the state-management phase; use it for global UI state and `useOptimistic()` for mutations |
| Testing | Jest and Playwright planned | Current stable Vitest and Playwright | Use Vitest instead of Jest for unit/integration tests and Playwright for E2E tests; install them during the testing phase |
| Linting and formatting | ESLint and Prettier | Current stable Biome | Remove ESLint/Prettier tooling and use Biome for linting, formatting, and import organization |
| Node.js | 18+ LTS | Node.js 22 LTS | Use Node.js 22 for the program standard |
| pnpm | 10.10.0+ | 9.x+ | Retain the installed pnpm 10 version |
| Deployment | Vercel, manual recommended | Vercel | Follow `project/README.md`; GitHub Actions remains optional and disabled by default |

## Required repository changes

### Tailwind CSS

```bash
pnpm add tailwindcss@latest @tailwindcss/postcss@latest
```

- Replace the Tailwind JavaScript configuration with CSS-first configuration in `app/globals.css`.
- Replace the legacy PostCSS plugin with `@tailwindcss/postcss`.
- Remove Autoprefixer and deprecated Tailwind animation plugins when they are no longer required.
- Use Tailwind 4-compatible shadcn/ui configuration and components.

### Clerk authentication

- Use the current stable `@clerk/nextjs` release.
- Configure `ClerkProvider`, authentication routes, and Next.js route protection.
- Keep credentials in `.env.local`.
- Use Clerk webhooks for application-user synchronization when database user records are required.

### Drizzle ORM and Neon

```bash
pnpm add drizzle-orm@latest @neondatabase/serverless@latest
pnpm add -D drizzle-kit@latest
```

- Use `drizzle-orm/neon-http`.
- Keep the schema in TypeScript and generate reviewed SQL migrations.
- Load `DATABASE_URL` from the local environment and require SSL for Neon.
- Apply schema changes through new migrations rather than editing migrations that have already been applied.

### Biome

```bash
pnpm remove eslint eslint-config-next prettier
pnpm add -D @biomejs/biome@latest
pnpm biome init
```

- Replace ESLint and Prettier scripts with Biome check, lint, and formatting scripts.
- Exclude generated output, dependencies, migrations, and lockfiles where appropriate.
- Keep TypeScript checking as a separate command.

### Testing

- Use current stable Vitest for unit and integration testing.
- Use current stable Playwright for end-to-end testing.
- Do not introduce the test framework before the repository reaches its testing phase.

### Node.js and pnpm

```bash
fnm install 22
fnm use 22
pnpm --version
```

Node.js 22 is the program standard. pnpm 10 is compatible with the handbook's pnpm 9-or-newer requirement.

### Deployment

- Use Vercel for deployment.
- Follow the manual deployment instructions in `project/README.md`.
- Treat the included GitHub Actions workflow as optional unless the project explicitly adopts automated deployment.

## Reference guides

- [Tailwind CSS upgrade guide](https://tailwindcss.com/docs/upgrade-guide)
- [Biome migration from ESLint and Prettier](https://biomejs.dev/guides/migrate-eslint-prettier/)
- [Clerk middleware for Next.js](https://clerk.com/docs/reference/nextjs/clerk-middleware)
- [shadcn/ui Tailwind v4 guide](https://ui.shadcn.com/docs/tailwind-v4)
- [Vitest migration guide](https://vitest.dev/guide/migration.html)
