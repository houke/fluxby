# Coding Standards for Fluxby

## TypeScript Configuration

- ✅ TypeScript strict mode enabled
- ✅ All files must use TypeScript (no plain JavaScript)
- ✅ Prefer interfaces over types for object shapes
- ✅ Use strict null checks

## Naming Conventions

- ✅ **Variables/Functions**: camelCase (`getTransactions`, `userId`)
- ✅ **Types/Interfaces**: PascalCase (`Transaction`, `MigrationContext`)
- ✅ **Constants**: UPPER_SNAKE_CASE (`DEMO_PROFILE_ID`, `LATEST_MIGRATION_VERSION`)
- ✅ **Files**: kebab-case (`data-service.ts`, `migration-runner.ts`)
- ✅ **React Components**: PascalCase (`TransactionRow.tsx`, `OnboardingContext.tsx`)

## Code Style

- ✅ Single quotes for strings
- ✅ 2 space indentation
- ✅ No semicolons (enforced by ESLint)
- ✅ Use arrow functions for React components
- ✅ Use functional components with hooks (no class components)

## Internationalization

- ✅ **All user-facing strings MUST be in language files** (`nl.ts`, `en.ts`)
- ❌ Never hardcode UI text in JSX
- ✅ Use `const { t } = useLanguage()` hook
- ✅ String interpolation: Use `{placeholder}` and `.replace('{placeholder}', value)`

## Database Queries

- ✅ Use parameterized queries: `db.runAsync(sql, params)`
- ✅ Wrap bulk operations in transactions: `db.transactionAsync(async () => {...})`
- ✅ Use async/await (not callbacks or promises with `.then()`)
- ✅ Handle errors with try/catch blocks

## React Component Patterns

- ✅ Use TanStack Query for data fetching
- ✅ Use Tailwind CSS for styling (no inline styles)
- ✅ Use Lucide React for icons
- ✅ Use shadcn/ui components where appropriate
- ✅ Toast notifications: Use `useToast()` from `ToastContext`

## UI/UX Guidelines

- ✅ **Edit action**: Pencil icon, hover → purple background
- ✅ **Delete action**: Trash icon, hover → red background, always confirm
- ✅ **All icon-only buttons MUST have tooltips**
- ✅ Use `rounded-md` for icon buttons (not circular)
- ❌ Never include icons in card titles
- ✅ Capitalize only first word in titles ("Name cleanup rules" not "Name Cleanup Rules")

## Testing

- ✅ Write tests for all new features
- ✅ Test file naming: `*.test.ts` or `*.test.tsx`
- ✅ Run `npm run lint && npm run typecheck && npm run test:run` before committing

## Documentation

- ✅ Update Swagger docs when adding/modifying API endpoints
- ✅ Add Bruno request files for new API endpoints
- ✅ Update developer docs (`/docs/*`) for API changes
- ✅ Update Help Center (`/help/*`) for end-user features
- ✅ Add NL and EN translations for new content

## Git Commit Messages

- ✅ Use conventional commit format: `<type>(<scope>): <description>`
- ✅ Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`
- ✅ Include detailed body with list of changes
- ✅ End with: `---\nDeveloped by [model name]`
