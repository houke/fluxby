# AGENTS.md

## Project Overview

Financieel Dashboard - Een lokale React applicatie voor het visualiseren van ING bank transacties. Monorepo structuur met TypeScript, React 19, Vite 6, Express backend en SQLite database.

## Setup Commands

- Install deps: `npm install`
- Start dev server: `npm run dev` (start zowel API, frontend als landing page)
- Build: `npm run build`
- Lint: `npm run lint`
- Lint with auto-fix: `npm run lint:fix`
- Format: `npm run format`
- Type check: `npm run typecheck`
- Run tests: `npm test`
- Run tests once: `npm run test:run`
- Test coverage: `npm run test:coverage`

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

## Project Structure

```
apps/
  api/          # Express.js backend (port 3001)
  web/          # React frontend (port 5173)
  landing/      # Fluxby landing page (port 5177)
packages/
  shared/       # Shared TypeScript types
data/
  fluxby.db     # SQLite database
```

## Code Style

- TypeScript strict mode
- Single quotes, 2 space indent
- React functional components met hooks
- TanStack Query voor data fetching
- Tailwind CSS met shadcn/ui componenten
- Nederlandse UI teksten

## Testing Instructions

- Run `npm run lint` to check TypeScript and ESLint
- Run `npm run test:run` to run all unit tests
- Run `npm run test:coverage` for coverage report
- Test API endpoints via Swagger UI or frontend
- Check for TypeScript errors: `npm run typecheck`

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

- Backend API draait op `http://localhost:3001/api`
- Frontend draait op `http://localhost:5173`
- Landing page draait op `http://localhost:5177`
- **Swagger API Docs**: `http://localhost:3001/api/docs`
- Database wordt automatisch aangemaakt bij eerste start
- CSV imports: sleep bestand naar Import pagina

## Before running dev (ports)

When starting the development servers you may sometimes hit EADDRINUSE errors because previous dev processes left ports open. Add these steps so both humans and LLM-based agents reliably free known dev ports before starting.

- macOS (zsh):

  ```bash
  # kill gracefully (SIGTERM) any processes using our known dev ports
  lsof -ti:3001,5173,5177 | xargs kill -15 2>/dev/null || true && sleep 0.5
  ```

- Cross-platform (npm script):

  ```bash
  npx kill-port 3001 5173 5177 || true
  ```

```bash
#!/usr/bin/env bash
# Kill known dev ports (attempt graceful first)
lsof -ti:3001,5173,5177 | xargs kill -15 2>/dev/null || true
sleep 0.5
```

This makes the behavior explicit for new contributors and LLMs that inspect the repository.

## API Documentation (Swagger)

API documentatie is beschikbaar via Swagger UI op `/api/docs`.

**BELANGRIJK**: Bij het toevoegen van nieuwe endpoints, voeg altijd Swagger JSDoc comments toe:

```typescript
/**
 * @swagger
 * /api/example:
 *   get:
 *     summary: Korte beschrijving
 *     tags: [TagNaam]
 *     parameters:
 *       - in: query
 *         name: paramNaam
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Succes response
 */
router.get('/example', (req, res) => { ... });
```

## Developer Documentation (Landing Page)

De developer documentatie is beschikbaar op de landing page (`apps/landing`) onder `/docs/*`.

**BELANGRIJK**: Bij het toevoegen of wijzigen van API functionaliteit, update ook de developer docs:

### Wanneer te updaten

1. **Nieuwe API Endpoints**: Voeg documentatie toe in `apps/landing/src/pages/docs/`
2. **Nieuwe API Resources**: Maak een nieuwe `Docs*.tsx` pagina en voeg toe aan:
   - `apps/landing/src/App.tsx` (route)
   - `apps/landing/src/components/docs/DocsSidebar.tsx` (navigatie)
   - `apps/landing/src/lib/i18n/nl.ts` en `en.ts` (vertalingen)
3. **Gewijzigde Response Formats**: Update de code voorbeelden en response types
4. **Nieuwe Query Parameters**: Documenteer in de parameter tabellen

### Docs Structuur

```
apps/landing/src/
├── pages/docs/           # Developer documentatie pagina's
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
├── pages/help/           # Help Center pagina's (eindgebruikers)
│   ├── HelpHome.tsx
│   ├── HelpBankConnection.tsx
│   ├── HelpBudgeting.tsx
│   ├── HelpPrivacy.tsx
│   └── HelpDevIntro.tsx
├── components/docs/      # Shared docs componenten
│   ├── DocsLayout.tsx
│   ├── DocsSidebar.tsx
│   └── CodeBlock.tsx
├── components/help/      # Help Center componenten
│   ├── HelpLayout.tsx
│   ├── HelpSidebar.tsx
│   └── ScreenshotPlaceholder.tsx
└── lib/i18n/            # Vertalingen (NL + EN)
    ├── nl.ts
    └── en.ts
```

## Help Center Documentation

Het Help Center is beschikbaar op `/help` en bevat documentatie voor eindgebruikers.

**BELANGRIJK**: Bij het toevoegen of wijzigen van belangrijke features, update ook de Help Center docs:

### Wanneer te updaten

1. **Nieuwe UI Features**: Voeg help artikelen toe voor eindgebruikers
2. **Gewijzigde Workflows**: Update bestaande help artikelen
3. **Nieuwe Screenshots**: Vervang `<ScreenshotPlaceholder>` componenten met echte screenshots

### Help Center Routes

- `/help` - Help Center home (split design: User Guide vs Developer Hub)
- `/help/*` - Gebruikersgids artikelen

### Checklist voor feature wijzigingen

- [ ] Developer docs bijgewerkt (`/docs/*`) - voor API/technische wijzigingen
- [ ] Help Center bijgewerkt (`/help/*`) - voor eindgebruiker-relevante wijzigingen
- [ ] NL en EN vertalingen toegevoegd voor nieuwe help content
- [ ] Screenshots/placeholders toegevoegd waar nodig

### Checklist voor API wijzigingen

- [ ] Swagger JSDoc comments toegevoegd/bijgewerkt
- [ ] Developer docs pagina bijgewerkt (indien van toepassing)
- [ ] Help Center bijgewerkt indien API wijziging eindgebruikers raakt
- [ ] Code voorbeelden getest en werkend
- [ ] NL en EN vertalingen toegevoegd
- [ ] Sidebar navigatie bijgewerkt (indien nieuwe pagina)
- [ ] Route toegevoegd in App.tsx (indien nieuwe pagina)

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
setToastMessage('Contact toegevoegd');

// ✅ Correct - using translation
setToastMessage(t.addressBook?.contactAdded || 'Contact added');

// ✅ Correct - with interpolation
setToastMessage(
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
- Use `TooltipProvider`, `Tooltip`, `TooltipTrigger`, and `TooltipContent` from shadcn/ui
- Tooltip text should use translations (e.g., `{t.common.edit}`, `{t.common.delete}`)
- Always use `rounded-md` class on icon-only buttons (never round/circular)

### Card Title Guidelines

- Never include icons in card titles
- Never capitalize all words - only capitalize the first word (e.g., "Name cleanup rules" not "Name Cleanup Rules")

### Toast Notifications

Always show a toast notification for:

- Creating items (contacts, rules, budgets, etc.)
- Deleting items
- Applying batch operations (e.g., "Toepassen op adresboek")
- Updating items
- Any action that changes data state

## PR Instructions

- Run `npm run lint` before committing
- Test changes in browser before PR
- Keep UI text translated in both Dutch and English
- **Update Swagger docs when adding/modifying API endpoints**
