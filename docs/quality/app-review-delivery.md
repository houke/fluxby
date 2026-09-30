# App review delivery

This branch implements the 2026-09-29 application review in three areas. The changes stay local until the branch is explicitly pushed.

## Confirmed gaps addressed

- Backup import now validates schema, checksums, references, and row relationships before replacing data. It offers a preview, creates an encrypted recovery snapshot, and restores the full set of application tables atomically.
- Peer sync now persists profile changes and tombstones, validates incoming data, handles conflicts and reconnects, and reports acknowledgement status. The optional developer API binds to loopback by default and requires a token for remote access.
- Budget editing stores a monthly base amount independently of the selected display period. Bulk budget creation is transactional. Subscription recurrence and date-only calculations handle calendar boundaries.
- CSV import uses the same robust parsing in preview and commit, requires a target account when needed, preserves skipped-row reasons, and keeps analytics and budget totals aligned for unassigned accounts.

## Usability and quality improvements

- Added accessible names, contrast fixes, keyboard and mobile controls, reduced-motion coverage, and a page-wide WCAG scan. Browser CI now includes WebKit and mobile projects.
- Added bilingual onboarding, help content, clearer security and storage documentation, locale-aware dates and money, contextual feedback, compact transactions, backup health, and direct import setup.
- Split database service responsibilities into smaller modules, adapted dashboard charts to the selected period, added a synthetic categorization evaluation, and established a reproducible browser performance baseline.

## New financial workflows

- Saved transaction views and compact transaction density.
- Savings goals and contributions, budget rollover, a safe-to-spend forecast, subscription renewal reminders, a persistent monthly review, and net-worth assets and liabilities.

## Validation boundaries

Final source checks: `npm run lint` passed with two existing warnings; `npm run typecheck` and `npm run build` passed. The Node 22 Vitest run passed 100 files and 1,480 tests. V8 coverage was 34.30% statements, 28.24% branches, 28.47% functions, and 34.83% lines; the configuration enforces a floor close to that baseline. `npm run evaluate:ai` validated 64 synthetic cases but correctly reported `live_not_run`, with no accuracy or latency claim.

The final bounded Chromium performance run imported 1,000 rows, passed SQLite integrity, and restored all 26 tables with the 1,000-row count intact. The 10,000-row import and visible idle task-time budgets remain unmet; measurements and reproduction details are in [browser-performance.md](browser-performance.md). The production-build browser suite passed 30 Chromium tests with 26 repository-marked skips, 11 mobile tests, and one WebKit page-wide scan. Seven focused Chromium financial/transaction tests passed again on the final build. Skipped sync-pairing UI flows are not browser acceptance. Local browser and in-memory peer tests do not substitute for native desktop or physical multi-device sync acceptance.
