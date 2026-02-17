# AGENTS.md

## Project Overview

Fluxby - A local-first financial dashboard for visualizing bank transactions. Monorepo structure with TypeScript, React 19, Vite 7, Tauri 2.0, and SQLite.

**Architecture**: Local-First, Password-Protected UI, Peer-to-Peer sync capable.

## Setup Commands

- Install dependencies: `npm install`
- Start UI dev: `npm run dev` (starts web app + landing concurrently)
- Start full local dev: `npm run dev:all` (starts API + web app + landing concurrently)
- Start Tauri dev: `npm run dev:tauri`
- Build: `npm run build`
- Build packages only: `npm run build:packages`
- Build Tauri: `npm run build:tauri`
- Lint: `npm run lint`
- Lint with auto-fix: `npm run lint:fix`
- Format: `npm run format`
- Type check: `npm run typecheck`
- Run tests: `npm test`
- Run tests once: `npm run test:run`
- Test coverage: `npm run test:coverage`
- Release (interactive): `npm run release`
- Release dry-run: `npm run release:dry`

## Prerequisites

- Node: `>=22.0.0` (see `package.json` engines)
- npm: `>=10.0.0`

## Development Workflow

### Fresh Clone Quick Start

On a fresh clone, you can immediately start development:

```bash
npm install
npm run dev
```

**No build step required** - Vite resolves workspace packages directly from source files in dev mode.

### How Package Resolution Works

The monorepo has three internal packages (`@fluxby/shared`, `@fluxby/database`, `@fluxby/core`). These are resolved differently depending on the context:

| Context             | Resolution              | Why                                       |
| ------------------- | ----------------------- | ----------------------------------------- |
| `npm run dev`       | Source files (`.ts`)    | Vite aliases point to `packages/*/src/`   |
| `npm run test:run`  | Source files (`.ts`)    | Vitest aliases point to `packages/*/src/` |
| `npm run build`     | Compiled dist (`.js`)   | Uses standard Node.js resolution          |
| `npm run typecheck` | Compiled dist (`.d.ts`) | TypeScript needs declaration files        |

### When to Build Packages

- **Development**: Never needed - `npm run dev` works without building
- **Testing**: Never needed - `npm run test:run` works without building
- **Type checking**: Automatically handled - `npm run typecheck` includes `build:packages`
- **Production builds**: Automatically handled - `npm run build` includes package builds
- **CI/Release**: Automatically handled - build scripts include dependencies

### Making Changes to Packages

When you modify files in `packages/*`:

1. **Dev mode**: Changes are picked up immediately via Vite HMR
2. **Tests**: Changes are picked up immediately when running tests
3. **TypeScript errors**: Run `npm run build:packages` then `npm run typecheck`

### Manual Package Build

If you need to manually rebuild packages (e.g., for IDE type resolution):

```bash
npm run build:packages
```

## Workflow Requirements

### Before Starting Complex Tasks

**IMPORTANT**: For complex multi-step tasks, always create a todo list first using the `manage_todo_list` tool:

- Break down the task into smaller, actionable items
- Mark each todo as in-progress before starting work
- Mark each todo as completed immediately after finishing
- This ensures visibility into progress and proper planning

### After Adding Features

**IMPORTANT**: Always run these checks after making changes:

```bash
# 1. Run linter to check for issues
npm run lint

# 2. Run type checker
npm run typecheck

# 3. Run tests
npm run test:run
```

Only commit when all checks pass. Fix any issues before proceeding.

### Feature Checklist

**IMPORTANT**: When adding new features, ensure the following are included:

1. **Onboarding Instructions**: If the feature has a UI component, add `data-onboarding` attributes and update the onboarding tour in `apps/web/src/components/onboarding/OnboardingContext.tsx`

2. **Database Migration**: If the feature requires new tables or columns:
   - Create a new migration file in `packages/database/src/migrations/`
   - Follow the naming convention: `00X_feature_name.ts`
   - Update `packages/database/src/migrations/index.ts` to include the new migration
   - Update `LATEST_MIGRATION_VERSION`

3. **Demo Data**: If the feature stores data, add demo data seeding:
   - Add constants to `packages/shared/src/seed-data.ts` (shared between API and web)
   - Update `apps/web/src/lib/data-service.ts` in `createDemoData()` function
   - Update `apps/api/src/routes/profiles.ts` in the seed-demo endpoint
   - Ensure demo data is cleared and re-seeded properly

4. **Translations**: Add all user-facing strings to both language files:
   - `apps/web/src/lib/i18n/nl.ts` (Dutch - primary, includes types)
   - `apps/web/src/lib/i18n/en.ts` (English)

5. **Help Documentation**: Update relevant help articles if the feature affects end users

### General LLM Contribution Guidelines

**IMPORTANT**: Any LLM contributing to this project must ensure that all ESLint, TypeScript, and test errors are fixed, even if they are outside the immediate scope of the task.

## Project Structure

```
apps/
  api/          # Express.js backend (port 3001) - for developers building custom interfaces
  web/          # React PWA frontend - uses OPFS for local-first storage
  landing/      # Fluxby landing page (port 5177) - marketing & docs
  tauri/        # Tauri desktop app wrapper - uses local SQLite
packages/
  shared/       # Shared TypeScript types & utilities
  database/     # Universal SQLite layer (OPFS/Tauri/Node adapters)
  core/         # Business logic (CSV parsing, categorization, analytics)
```

## Architecture Overview

### Local-First Design (OPFS)

The Fluxby web app is **100% local-first** and designed to run on **GitHub Pages** without any backend:

- **Web**: SQLite runs in browser via WASM, data stored in OPFS (Origin Private File System)
- **Desktop (Tauri)**: SQLite via WASM, data stored in AppLocalData
- **No server required**: The app works entirely offline in the browser

### API Server (For Developers Only)

The API server (`apps/api`) is **optional** and intended only for developers who want to build their own interfaces:

- Uses `better-sqlite3` (native Node.js SQLite)
- Data stored in `data/` folder at project root
- Provides REST API with Swagger documentation
- **NOT used by the main Fluxby web app** - the web app uses OPFS directly

**Note**: The web app does NOT require the API server. It uses the OPFS database directly via
`packages/database`. The API is a separate tool for developers building custom integrations.

### Security Model (Password Protection)

1. User sets a password during onboarding
2. Password hash stored via PBKDF2 (100k iterations)
3. App locks on idle/close - password required to unlock UI

### Sync (Peer-to-Peer)

- All tables have: `id` (UUID), `updated_at`, `is_deleted`, `device_id`
- Conflict resolution: Last-Write-Wins (LWW)
- Device pairing via PeerJS (WebRTC)
- No central server - devices sync directly

### OPFS Database Performance

**CRITICAL**: OPFS (Origin Private File System) has high overhead for individual sync operations. Follow these guidelines to ensure good performance:

#### Always Use Transactions for Bulk Operations

When inserting, updating, or deleting multiple rows, **always** wrap the operations in a transaction:

```typescript
// ❌ Wrong - each INSERT triggers an OPFS sync
for (const item of items) {
  await db.runAsync('INSERT INTO table VALUES (?)', [item]);
}

// ✅ Correct - all INSERTs happen in one transaction, single OPFS sync
await db.transactionAsync(async () => {
  for (const item of items) {
    await db.runAsync('INSERT INTO table VALUES (?)', [item]);
  }
});
```

**Why**: Each individual `db.runAsync()` outside a transaction causes:

1. A Main Thread → Worker hop
2. A disk sync to OPFS
3. High latency per operation (~10-50ms)

With transactions, all operations share a single commit/sync, dramatically improving performance.

#### When to Use Transactions

- **Profile creation**: Seeding categories, rules, and settings
- **CSV imports**: Inserting multiple transactions
- **Bulk updates**: Reordering accounts, applying rules to transactions
- **Migrations**: Any operation touching multiple rows

#### Data Access Optimization

- Prefer selecting specific columns over `SELECT *` for large tables
- Use indexes for frequently filtered/sorted columns
- Consider pagination for large result sets
- Cache frequently accessed static data (categories, rules)

#### OPFS Worker Communication

- The database runs in a Web Worker to avoid blocking the UI
- All database operations are async and go through the worker
- Minimize worker communication by batching operations
- Use `queryClient.invalidateQueries()` efficiently after mutations

## Code Style

- TypeScript strict mode
- Single quotes, 2 space indent
- React functional components with hooks
- TanStack Query for data fetching
- Tailwind CSS
- Bilingual UI (Dutch and English)

## Nexus Agent System

This repository uses the **Nexus multi-agent orchestration system** for complex planning, execution, and review workflows.

### System Overview

```
.nexus/                     # Project-specific orchestration files
├── features/               # Feature planning and tracking
├── memory/                 # Agent preferences and learned behaviors
├── toc.md                  # Master feature index
├── tmp/                    # Temporary files (gitignored)
└── logs/                   # Execution logs

.github/
├── agents/                 # Agent definitions (12 specialized agents)
├── prompts/                # Workflow prompts (Nexus workflows)
└── skills/                 # Domain-specific knowledge (16 skills)

.nexusrc                    # Points to central Nexus template repo
```

### The Orchestrator (@Nexus)

The **@Nexus** agent is the orchestrator that:

- **Triages** incoming requests to determine which agent(s) are needed
- **Delegates** work to specialized agents using `runSubagent`
- **Synthesizes** multi-agent responses into unified answers
- **Maintains context** across agent interactions
- **Never implements directly** - only coordinates

### Specialized Agents

| Agent               | File                        | Purpose                                          |
| ------------------- | --------------------------- | ------------------------------------------------ |
| Nexus               | `nexus.agent.md`            | **Orchestrator** - delegates to all agents       |
| Architect           | `architect.agent.md`        | System design, schemas, local-first architecture |
| Software Developer  | `software-developer.agent.md` | Implementation, TDD, production code           |
| Tech Lead           | `tech-lead.agent.md`        | Code quality, patterns, architectural decisions  |
| QA Engineer         | `qa-engineer.agent.md`      | Testing, edge cases, accessibility               |
| Security Agent      | `security.agent.md`         | Security audits, OWASP, vulnerabilities          |
| Product Manager     | `product-manager.agent.md`  | Requirements, priorities, acceptance criteria    |
| UX Designer         | `ux-designer.agent.md`      | User flows, wireframes, interactions             |
| Visual Designer     | `visual-designer.agent.md`  | UI polish, animations, styling                   |
| DevOps              | `devops.agent.md`           | CI/CD, infrastructure, deployment                |
| Gamer               | `gamer.agent.md`            | Gamification mechanics, engagement               |
| SEO Specialist      | `seo-specialist.agent.md`   | SEO optimization, search rankings                |

### Core Workflows

| Workflow | Prompt | Purpose |
| -------- | ------ | ------- |
| Planning | `#nexus-planning` | Orchestrates all agents to create comprehensive feature plans |
| Execution | `#nexus-execution` | Takes plans and coordinates implementation |
| Review | `#nexus-review` | Comprehensive code review with automatic fixes |
| Sync | `#nexus-sync` | Reconciles documentation with actual work done |
| Summary | `#nexus-summary` | Project status snapshot (have vs need) |
| Hotfix | `#nexus-hotfix` | Expedited workflow for small, well-understood bugs |

### Feature Tracking

All features are tracked in `.nexus/toc.md` with status lifecycle:

```
draft → in-progress → review → complete
```

Feature files are stored in `.nexus/features/<feature-slug>/`:
- `plan.md` - What we're building and why
- `execution.md` - Implementation tracking
- `review.md` - Code review findings
- `summary.md` - Status snapshots

### MCP Servers

Available MCP integrations (`.vscode/mcp.json`):

- **filesystem** - Enhanced file operations
- **playwright** - E2E test automation
- **sequential-thinking** - Complex problem decomposition

### ⛔ Critical Safety Rules

These rules are **ABSOLUTE** and must **NEVER** be violated by any agent:

1. **NEVER Run Interactive Commands** - Use non-interactive flags (`-y`, `--yes`)
2. **NEVER Delete Infrastructure Directories** - `.nexus/`, `.github/`, `.vscode/`
3. **Use `.nexus/tmp/`** - For all temporary files instead of system `/tmp`
4. **Clean Up After Yourself** - Agents MUST remove temporary files they create

## Security Considerations

- Ensure all sensitive data is encrypted at rest and in transit.
- Regularly update dependencies to patch known vulnerabilities.
- Use environment variables for storing secrets and API keys.
- Implement role-based access control (RBAC) for API endpoints.

## Testing Instructions

- Run `npm run lint` to check TypeScript and ESLint
- Run `npm run test:run` to run all unit tests
- Run `npm run test:coverage` for coverage report
- Test API endpoints via Swagger UI or frontend
- Check for TypeScript errors: `npm run typecheck`

### Integration Tests

- Integration tests should be added for new API endpoints.
- Use `vitest` for unit tests and `supertest` for API testing.
- Example:

```javascript
import request from 'supertest';
import app from '../src/app';

describe('GET /api/example', () => {
  it('should return 200 and expected data', async () => {
    const res = await request(app).get('/api/example');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
  });
});
```

### Test Structure

Tests are located in the `/tests` directory:

- `tests/shared/` - Shared package utility tests
- `tests/api/` - Backend API tests
- `tests/web/` - Frontend component/hook tests

See `tests/README.md` for the test coverage overview table.

### Writing Tests for New Features

**IMPORTANT**: Every new feature MUST have accompanying tests.

#### When to Write Tests

1. **API Endpoints**: Add tests in `tests/api/` for:
   - Request validation (required params, types)
   - Success responses with expected data structure
   - Error handling (404, 400, 500)
   - Edge cases (empty data, invalid IDs)

2. **Utility Functions**: Add tests in `tests/shared/` for:
   - All pure functions in `packages/shared/src/`
   - Date formatting, currency formatting, string utils
   - Edge cases (null, undefined, empty strings)

3. **Frontend Logic**: Add tests in `tests/web/` for:
   - Custom hooks
   - Complex state logic
   - Data transformation functions

#### Test File Naming

- Use `.test.ts` suffix for test files
- Match the source file structure:
  - `packages/shared/src/utils.ts` → `tests/shared/utils.test.ts`
  - `apps/api/src/routes/categories.ts` → `tests/api/categories.test.ts`
  - `apps/web/src/hooks/useFilter.ts` → `tests/web/hooks/useFilter.test.ts`

#### Before Confirming Changes

**ALWAYS** run the full test suite before confirming any changes:

```bash
# Run all checks
npm run lint && npm run typecheck && npm run test:run
```

If any tests fail, fix them before proceeding.

## Development Tips

- Landing page runs at `http://localhost:5177`
- Web app (OPFS mode) is proxied via landing page at `/app/`
- Web app dev server runs on port 5178 (proxied through landing page)
- **For web app dev only**: `npm run dev:web` (runs on port 5178)
- **For API dev only**: `npm run dev:api` (runs on port 3001)
- **API (for developers building custom interfaces)**: `http://localhost:3001/api`
- **Swagger API Docs**: `http://localhost:3001/api/docs`
- Database is created automatically in OPFS on first load
- CSV imports: drag file to Import page

## Before Running Dev (Ports)

When starting the development servers you may sometimes hit EADDRINUSE errors because previous dev processes left ports open. Add these steps to reliably free known dev ports before starting.

- macOS (zsh):

  ```bash
  # Kill gracefully (SIGTERM) any processes using our known dev ports
  lsof -ti:3001,5177,5178 | xargs kill -15 2>/dev/null || true && sleep 0.5
  ```

- Cross-platform (npm script):

  ```bash
  npx kill-port 3001 5177 5178 || true
  ```

This makes the behavior explicit for new contributors and LLMs that inspect the repository.

## API Documentation (Swagger)

API documentation is available via Swagger UI at `/api/docs`.

**IMPORTANT**: When adding new endpoints, always add Swagger JSDoc comments:

```typescript
/**
 * @swagger
 * /api/example:
 *   get:
 *     summary: Short description
 *     tags: [TagName]
 *     parameters:
 *       - in: query
 *         name: paramName
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success response
 */
router.get('/example', (req, res) => { ... });
```

## Bruno API Collection

A [Bruno](https://www.usebruno.com/) collection is available in the `apps/api/bruno/` folder for testing API endpoints.

**IMPORTANT**: When adding new API endpoints, always create a Bruno request file:

1. Create a `.bru` file in the appropriate folder (`apps/api/bruno/accounts/`, `apps/api/bruno/transactions/`, etc.)
2. Follow the naming convention: `Verb Noun.bru` (e.g., `Get All Accounts.bru`)
3. Add documentation in the `docs` section
4. Test the endpoint with Bruno before committing

See `apps/api/bruno/README.md` for more details and a template.

## Developer Documentation (Landing Page)

Developer documentation is available on the landing page (`apps/landing`) at `/docs/*`.

**IMPORTANT**: When adding or modifying API functionality, also update the developer docs:

### When to Update

1. **New API Endpoints**: Add documentation in `apps/landing/src/pages/docs/`
2. **New API Resources**: Create a new `Docs*.tsx` page and add to:
   - `apps/landing/src/App.tsx` (route)
   - `apps/landing/src/components/docs/DocsSidebar.tsx` (navigation)
   - `apps/landing/src/lib/i18n/nl.ts` and `en.ts` (translations)
3. **Changed Response Formats**: Update the code examples and response types
4. **New Query Parameters**: Document in the parameter tables

### Docs Structure

```
apps/landing/src/
├── pages/docs/           # Developer documentation pages
│   ├── DocsIntroduction.tsx
│   ├── DocsAuthentication.tsx
│   ├── DocsProfiles.tsx
│   ├── DocsErrors.tsx
│   ├── DocsAccounts.tsx
│   ├── DocsTransactions.tsx
│   ├── DocsCategories.tsx
│   ├── DocsBudgets.tsx
│   ├── DocsAnalytics.tsx
│   └── DocsAddressBook.tsx
├── pages/help/           # Help Center pages (end users)
│   ├── HelpHome.tsx
│   ├── HelpBankConnection.tsx
│   ├── HelpBudgeting.tsx
│   ├── HelpPrivacy.tsx
│   └── HelpDevIntro.tsx
├── components/docs/      # Shared docs components
│   ├── DocsLayout.tsx
│   ├── DocsSidebar.tsx
│   └── CodeBlock.tsx
├── components/help/      # Help Center components
│   ├── HelpLayout.tsx
│   ├── HelpSidebar.tsx
│   └── ScreenshotPlaceholder.tsx
└── lib/i18n/            # Translations (NL + EN)
    ├── nl.ts
    └── en.ts
```

## Help Center Documentation

The Help Center is available at `/help` and contains documentation for end users.

**IMPORTANT**: When adding or modifying important features, also update the Help Center docs:

### When to Update

1. **New UI Features**: Add help articles for end users
2. **Changed Workflows**: Update existing help articles
3. **New Screenshots**: Replace `<ScreenshotPlaceholder>` components with actual screenshots

### Help Center Routes

- `/help` - Help Center home (split design: User Guide vs Developer Hub)
- `/help/*` - User guide articles

### Checklist for Feature Changes

- [ ] Developer docs updated (`/docs/*`) - for API/technical changes
- [ ] Help Center updated (`/help/*`) - for end-user relevant changes
- [ ] NL and EN translations added for new help content
- [ ] Screenshots/placeholders added where needed

### Checklist for API Changes

- [ ] Swagger JSDoc comments added/updated
- [ ] Bruno request file added in `apps/api/bruno/` folder
- [ ] Developer docs page updated (if applicable)
- [ ] Help Center updated if API change affects end users
- [ ] Code examples tested and working
- [ ] NL and EN translations added
- [ ] Sidebar navigation updated (if new page)
- [ ] Route added in App.tsx (if new page)

## Database Schema

Key tables: `accounts`, `transactions`, `categories`, `budgets`, `category_rules`, `imports`

## UI/UX Guidelines

### Internationalization (i18n)

**IMPORTANT**: All user-facing strings MUST be in the language files, never hardcoded.

- Language files are located at `apps/web/src/lib/i18n/` and `apps/landing/src/lib/i18n/`
- Dutch translations: `nl.ts` (primary)
- English translations: `en.ts`
- Type definitions are in `nl.ts` - update the `TranslationKeys` interface when adding new strings
- Use the `useLanguage()` hook to access translations: `const { t } = useLanguage()`
- String interpolation: Use `{placeholder}` syntax, e.g., `'{count} items'` and replace with `.replace('{count}', value)`
- Never use template literals with hardcoded text in JSX

Example:

```typescript
// ❌ Wrong - hardcoded string
alert('Contact added');

// ✅ Correct - using translation
alert(t.addressBook?.contactAdded || 'Contact added');

// ✅ Correct - with interpolation
alert(
  (t.addressBook?.namesUpdated || '{count} names updated').replace(
    '{count}',
    String(count)
  )
);
```

### Action Button Styling

- **Edit action**: Pencil icon, on hover: purple background (`bg-purple-600`) with white icon
- **Delete action**: Trash icon, on hover: red background (`bg-red-600`) with white icon. Always show confirmation dialog before performing delete
- **Save/Cancel in edit mode**: Check icon (save) and X icon (cancel), on hover: purple background with white icon

### Icon-only Buttons

- **All icon-only buttons MUST have a tooltip** explaining the action
- Use `TooltipProvider`, `Tooltip`, `TooltipTrigger`, and `TooltipContent`
- Tooltip text should use translations (e.g., `{t.common.edit}`, `{t.common.delete}`)
- Always use `rounded-md` class on icon-only buttons (never round/circular)

### Card Title Guidelines

- Never include icons in card titles
- Never capitalize all words - only capitalize the first word (e.g., "Name cleanup rules" not "Name Cleanup Rules")

### Toast Notifications

**IMPORTANT**: Do not create local state for notifications. Always use the Global Toast Context.

Import and use the toast hook:

```typescript
import { useToast } from '@/contexts/ToastContext';

// In your component:
const toast = useToast();

// Show toasts with appropriate variants:
toast.success('Operation completed'); // Green - auto-dismisses
toast.info('Information message'); // Purple - auto-dismisses
toast.warning('Warning message'); // Orange - requires manual dismiss
toast.error('Error occurred'); // Red - requires manual dismiss
toast.error(error); // Also accepts Error objects
```

Always show a toast notification for:

- Creating items (contacts, rules, budgets, etc.)
- Deleting items
- Applying batch operations
- Updating items
- Any action that changes data state

## PR Instructions

- Run `npm run lint` before committing
- Test changes in browser before PR
- Keep UI text translated in both Dutch and English
- **Update Swagger docs when adding/modifying API endpoints**
- **Add Bruno request files for new API endpoints**

## Commit Messages

**IMPORTANT**: At the end of each task, agents should use the git tools to stage and commit changes themselves, then output the commit message they used.

Format: Use conventional commit format with `git commit -m "<type>(<scope>): <description>" -m "<body>"`

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `ci`, `build`

Example output at the end of changes:

```bash
git commit -m "feat(web): add transaction filtering by date range" -m "- Add DateRangePicker component
- Update useTransactionState hook with date filter
- Add translations for filter labels (NL/EN)
- Update Swagger docs for date query params"
```

The commit message should:

- Use conventional commit format
- Be comprehensive (include all changes in the body)
- List specific files/components changed when helpful
- Mention translations, tests, and docs updates if applicable
- End the commit message body with "---" followed by "Developed by [model name]" on a new line (replacing [model name] with the actual model name used)
