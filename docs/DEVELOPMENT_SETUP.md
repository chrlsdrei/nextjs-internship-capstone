# Development Setup Guide

## Prerequisites

- **Node.js**: Version 22 LTS
- **pnpm**: Latest version (`npm install -g pnpm`)
- **Git**: Latest version
- **VS Code**: Recommended IDE
- **Neon PostgreSQL**: Cloud database

## Required VS Code Extensions

Install these extensions for the best development experience:

- **Biome** (`biomejs.biome`)
- **Tailwind CSS IntelliSense** (`bradlc.vscode-tailwindcss`)
- **TypeScript Importer** (`pmneo.tsimporter`)
- **Auto Rename Tag** (`formulahendry.auto-rename-tag`)
- **GitLens** (`eamodio.gitlens`)

## Project Setup

### 1. Fork and Clone Your Repository

**Each intern should fork the repository individually:**

```bash
# 1. Go to https://github.com/stratpoint-engineering/nextjs-internship-capstone
# 2. Click "Fork" to create your own copy
# 3. Clone YOUR fork locally
git clone https://github.com/YOUR-USERNAME/nextjs-internship-capstone.git
cd nextjs-internship-capstone/project
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Environment Setup

Copy the environment template:

```bash
cp .env.example .env.local
```

Fill in the required environment variables (will be provided during onboarding).

### 4. Database Setup

Run database migrations:

```bash
pnpm db:generate
pnpm db:migrate
```

### 5. Start Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Development Workflow

### Individual Fork Workflow

Since each intern works on their own fork, you have complete control over your repository:

1. **Create feature branches** for major features:
   ```bash
   git checkout -b feature/authentication
   git checkout -b feature/kanban-board
   git checkout -b feature/task-management
   ```

2. **Make your changes** and commit regularly:
   ```bash
   git add .
   git commit -m "feat: add task creation modal"
   ```

3. **Push your branch**:
   ```bash
   git push origin feature/authentication
   ```

4. **Merge to your main branch** when feature is complete:
   ```bash
   git checkout main
   git merge feature/authentication
   git push origin main
   ```

### Branch Naming Convention

- `feature/[feature-description]`
- `fix/[bug-description]`
- `docs/[documentation-update]`

Examples:
- `feature/add-task-modal`
- `fix/drag-drop-bug`
- `docs/update-setup-guide`

### Optional: Sync with Original Repository

If you want to get updates from the original repository:

```bash
# Add the original repo as upstream (one time setup)
git remote add upstream https://github.com/stratpoint-engineering/nextjs-internship-capstone.git

# Fetch and merge updates when needed
git fetch upstream
git checkout main
git merge upstream/main
git push origin main
```

### Commit Message Convention

Use conventional commits:

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

## Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm check` - Run Biome formatting, linting, and import checks
- `pnpm check:write` - Apply Biome formatting and safe lint fixes
- `pnpm lint` - Run Biome linting
- `pnpm format` - Format files with Biome
- `pnpm format:check` - Check formatting with Biome
- `pnpm type-check` - Run TypeScript type checking
- `pnpm test` - Run unit tests
- `pnpm test:watch` - Run tests in watch mode
- `pnpm test:e2e` - Run end-to-end tests
- `pnpm db:generate` - Generate database migrations
- `pnpm db:migrate` - Run database migrations
- `pnpm db:studio` - Open database studio (if using Drizzle Studio)

## Code Quality Standards

### TypeScript

- Use strict TypeScript mode
- Define proper types for all props and functions
- Avoid `any` type unless absolutely necessary
- Use proper type imports: `import type { ... }`

### React Best Practices

- Use functional components with hooks
- Follow the Rules of Hooks
- Use Server Components by default, Client Components when needed
- Proper error boundaries for error handling

### Styling Guidelines

- Use Tailwind CSS utility classes
- Follow mobile-first responsive design
- Use Shadcn/UI components when possible
- Consistent spacing and typography scale

### File Organization

```
project/                   # Your project directory
├── app/                   # Next.js App Router pages
│   ├── (auth)/           # Auth-related pages (placeholder)
│   ├── (dashboard)/      # Dashboard pages ✅ Implemented
│   └── api/              # API routes (to be implemented)
├── components/           # Reusable components ✅ Basic structure
│   ├── ui/               # Shadcn/UI components (to be added)
│   └── modals/           # Modal components (placeholder)
├── lib/                  # Utilities and configurations
│   ├── db/               # Database related (placeholder)
│   └── utils.ts          # Helper functions ✅
├── hooks/                # Custom React hooks (placeholder)
├── stores/               # Zustand stores (placeholder)
├── types/                # TypeScript type definitions ✅
└── styles/               # Additional styles
```

## Testing Guidelines

- Write unit tests for utility functions
- Test React components with React Testing Library
- Write integration tests for user flows
- E2E tests for critical user journeys
- Aim for 80%+ test coverage

## Getting Help

- **Daily Standups**: Share progress and blockers with other interns
- **Optional Code Reviews**: Share your fork for peer feedback and learning
- **Mentor Office Hours**: 1-on-1 guidance sessions
- **Team Chat**: Quick questions and collaboration
- **GitHub Issues**: Create issues in your fork to track bugs and features
- **Knowledge Sharing**: Help other interns with similar challenges

## Troubleshooting

### Common Issues

1. **Port already in use**:
   ```bash
   lsof -ti:3000 | xargs kill -9
   ```

2. **Node modules issues**:
   ```bash
   rm -rf node_modules pnpm-lock.yaml
   pnpm install
   ```

3. **Database connection issues**:
   - Check environment variables
   - Verify database is running
   - Check network connectivity

4. **TypeScript errors**:
   ```bash
   pnpm type-check
   ```

### Getting Additional Help

If you're stuck for more than 30 minutes:

1. Check the documentation
2. Search existing GitHub Issues
3. Ask in team chat
4. Schedule time with mentor
5. Create a GitHub Issue with detailed description

Remember: **There are no "dumb" questions!** Everyone is here to learn and grow together.
