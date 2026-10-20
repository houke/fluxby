# App performance review — 3–6 October 2026

Status: browser performance review and remediation complete. Source, regression tests, production builds, and isolated browser measurements are verified; native full-day behavior remains unverified.

The review covers encrypted browser storage, imports and restore, startup bundles, transaction and contact queries, every app route, profile switching, search, CSV worker lifecycle, sync lifecycle, and landing/help animations. Measurements use disposable synthetic profiles; no existing financial profile is accessed.

## Baseline

Node v24.21.0, native SQLite ABI 137, Chromium 153.0.8010.12. Browser timings use a development build on this Mac; production entry sizes come from a separate production build. The benchmark generates dates in the browser's current month, verifies the selected storage backend, and checks data integrity. The old hardcoded September dates caused a false empty-view timeout in October.

| Measurement                            |                   Before fixes |
| -------------------------------------- | -----------------------------: |
| Encrypted OPFS import, 1,000 rows      |                        3.874 s |
| OPFS restore, 1,000 rows / 39 tables   |                        8.239 s |
| OPFS 100-row queries, five samples     |                    3.5–10.1 ms |
| OPFS first transaction row             |                        0.649 s |
| OPFS steady visible renderer task time |                   15.94–16.23% |
| Web entry JavaScript                   | 2,168,310 bytes / 597,649 gzip |
| Eager chart dependency                 |   455,364 bytes / 129,644 gzip |
| Landing entry JavaScript               |   969,952 bytes / 252,162 gzip |

Localhost deliberately selects IndexedDB. Its separate baseline imported 1,000 rows in 0.585 s and 10,000 rows in 56.221 s; restoring the resulting 11,000 rows took 94.942 s. These are distinct from OPFS measurements. All completed baseline imports passed `PRAGMA integrity_check`, and restores preserved their transaction counts.

An idle timeline and CPU profile identify the mascot's detailed fur drawing as the dominant JavaScript work. The initial idle window also includes delayed database work. Heap moves up and down during short samples; these measurements do not establish a growing heap leak. CDP's requested frozen state continued to record animation work, so its task-time numbers cannot establish actual hidden-tab behavior.

## Confirmed issues and fixes

- Completed database operations and initialization races retained timeout callbacks until their deadlines. Clear those handles on completion, failure, or timeout. First-row queries stop after one row; result column metadata is read once per statement. Remove the nested lock that deadlocked migration checking.
- Async transactions allowed unrelated operations to share a transaction and timed-out queued mutations to execute later. Hold the original connection queue through commit/rollback, supply a scoped connection to callbacks and nested savepoints, drain active statements before rollback, and reject expired queued work or retained scopes. Convert production callers and helpers to that connection contract.
- SQLite's default 2 MiB cache spilled dirty pages during growing encrypted OPFS imports. In this VFS, subsequent reads close the writable stream and reopening it copies the entire file. The diagnostic interval reopened it 1,315 times as the file reached 6 MB. Use a session-only 32 MiB OPFS cache budget, retaining page spilling, DELETE journaling, and synchronous=2. Cache successful encrypted write pages and physical sizes within the existing lock epoch; preserve failed-write and lock invalidation rules. SQLite describes the cache setting as a suggested connection budget allocated as needed. [SQLite cache documentation](https://www.sqlite.org/pragma.html#pragma_cache_size)
- Four composite indexes were never installed because old migrations reused existing names with `IF NOT EXISTS`. Migration 023 repairs them for existing and new databases. Native query-plan tests verify covering/indexed lookups. Fresh legacy migrations check columns before `ALTER TABLE`, avoiding five duplicate-column exceptions on startup.
- Import contact creation and transaction linking performed repeated independent commits. Group them in bounded transactions and avoid rewriting unmatched links. Address-book IBAN lookup uses a profile-scoped join instead of an unbounded parameter list. Profile deletion, seed categories, address-book deletion, and contact merge are atomic bulk operations.
- Backup restore prepared an insert for every row. Batch consecutive rows with matching column sets inside the existing atomic transaction, preserving missing-column defaults, explicit nulls, validation, foreign keys, and rollback. Cache schema-column lookup during validation. Multi-row statements use `OR FAIL` and propagate any error to the enclosing transaction's full rollback; this avoids expensive statement journals while retaining the durable transaction journal. Mid-batch unique and deferred foreign-key failures have regressions that verify the original dataset is fully restored. [SQLite statement-journal documentation](https://www.sqlite.org/tempfiles.html#statement_journal_files)
- Closed Spotlight search fetched all transactions and sliced to 100. Fetch at most 100 when search opens, reuse the contact cache, and include the active profile in query keys. Remove the extra full-history empty-state query and unused category-suggestion calls. Sum recurring history only for its expanded row.
- Profile switching traversed the query cache 31 times and omitted newer profile-scoped caches. Use one invalidation predicate, remove old profile entries, and release the switch timer.
- Expanded contact and subscription histories rendered every transaction inside a scroll box. Render twenty records per page with existing Dutch/English navigation labels; tie expanded details and query keys to the active profile and clear them on switching. Spotlight now uses the same statistics-rich address-book response as other consumers of that shared cache.
- CSV reset/abort/superseding requests could leave old workers alive and deliver stale responses to new requests. Retire those workers, settle pending promises, and ignore retired handlers. Paginate skipped import results so large duplicate files do not create an unbounded DOM.
- Configured CSV preview and normalization still ran synchronously on the page. Reuse the same parser in the worker, return at most ten preview rows or the prepared CSV/mapping, and reject stale file reads, worker/Jev responses, and import results after upload/options/profile changes.
- Average spending spread every date into `Math.min`/`Math.max` and crashed on 200,000 records. Aggregate expenses and date bounds in one pass with bounded auxiliary memory.
- A late sync initialization could start an obsolete peer after profile switching or unmount. Guard completion against cleanup. Full snapshots remain necessary for deletion/tombstone correctness across historical and offline pairings; an empty paired-device list is insufficient evidence to skip them.
- Sync capture stamped each changed row with a separate statement. Update up to 200 rows per statement with their individual monotonic clocks, skip identical stored metadata, and preserve profile/contact scoping, resets, deletion tombstones, and atomic rollback/retry.
- Desktop mascots redrew thousands of gradient fur strokes each frame. Retain one detail layer for larger interactive instances and refresh it at a lower cadence. Compact logos reuse eight bounded fur poses and draw up to fifteen frames per second, preserving breathing, blinking, eye movement, rotation, and particles. Cache and release the desktop GPU capability probe.
- Landing import completion scheduled another reset timeout every frame; several screenshot demos rebuilt React lists every frame. Own one reset timer, use compositor transforms for scrolling lists, use elapsed phases and bounded state updates, and suspend help/screenshot animation offscreen, when hidden, or under reduced motion.
- Every web route and landing help/developer/legal page loaded eagerly. Split routes and optional pages with localized loading states. Generated service workers precache built JavaScript, CSS, and WASM to preserve offline navigation. Validate scope boundaries, build revision cleanup, and cache failures.
- The first production offline check exposed a nonexistent landing `manifest.json` precache entry, which aborted worker installation. Remove that entry and verify required static precache assets exist in both public roots. Include the OpenAPI document in precaching and its content in the build revision, and load it through the deployment base path.

## Earlier measurements, 3 October 2026

The configured parser comparison uses the same synthetic 100,000-row / 3.19 MB CSV on both paths. Synchronous preparation takes 269.2 ms and leaves a 277.0 ms gap in a ten-millisecond UI heartbeat. Worker preparation takes 337.2 ms including startup/message transfer, with a maximum heartbeat gap of 14.4 ms. Preview gaps fall from 53.7 ms to 13.9 ms, with ten preview rows and the full 100,000-row count preserved. This improves UI responsiveness; it does not claim shorter overall parser elapsed time.

The earlier encrypted OPFS run imports 1,000 rows in 1.427 s and another 10,000 in 57.538 s with zero errors or skipped records. SQLite integrity checking returns `ok` after both imports. Export takes 94 ms; atomic restore replaces all 39 financial tables in 7.359 s, preserves exactly 11,000 transactions, and passes integrity checking. Optional VFS diagnostics confirm that restore no longer creates the temporary statement journal responsible for the slow run. Encryption, DELETE journaling, synchronous=2, and page spilling remain enabled.

The transaction list renders fifty initial rows in 0.951 s on that 11,000-row dataset. Visible renderer task time is 5.42% during the first settling window, then 1.09% and 0.93% during the two steady twenty-second windows; script time in those steady windows is 35 ms and 34 ms. Heap stays around 51 MB over those short windows, which does not establish long-duration memory behavior.

The five 100-row query samples on 1,000 rows take 3.5–3.9 ms. On 11,000 rows, four take 2.5–3.3 ms and one takes 1.172 s while waiting behind the atomic background sync stamp. Client elapsed time includes queue waiting, and this outlier is retained in the results; the immediate post-import query target is not met in every sample.

The default requested frozen state is labeled `cdp-freeze-request`. This Mac's automated Chromium reports `visible` after tab switching and after CDP confirms a minimized window, including with automation background flags removed. Actual hidden-tab task time is therefore unverified; lifecycle regressions test visibility-event handling, but do not substitute for a native background measurement.

Contact history now fetches twenty rows per SQL page with stable date/id ordering and active-contact/profile ownership, preserving the service's fifty-row default for other callers. Controlled paging reaches older records; profile/contact changes and collapse reset the page. Dutch and English Address Book help describes the navigation. Native and rendered regressions cover complete reachability beyond fifty records, deleted/foreign contacts, both languages, bounded DOMs, and profile switches.

These measurements predate the additional connection-lifecycle, sync, service-worker, and WebKit fixes below. An intermittent API fixture listener collision was fixed by binding its disposable server explicitly to IPv4 and closing it after the suite.

## Final isolated measurements, 6 October 2026

The [complete JSON report](performance-browser-2026-10-06.json) records the final source with no concurrent builds or browser tests. It uses encrypted OPFS, schema version 23, DELETE journaling, synchronous=2, and the 32 MiB suggested cache budget with spilling enabled. There are no browser errors or failed stages.

| Measurement                                    | Final result                  |
| ---------------------------------------------- | ----------------------------- |
| Fresh launch / encrypted lock / unlock         | 1.367 s / 0.462 s / 1.142 s   |
| Import 1,000 / 10,000 additional rows          | 1.548 s / 65.939 s            |
| Import errors / skipped records                | 0 / 0                         |
| 100-row queries on 1,000 / 11,000 rows         | 3.9–4.3 ms / 2.9–3.8 ms       |
| First transaction row / initial DOM rows       | 2.113 s / 50                  |
| First settling idle window                     | 5.97% renderer task time      |
| Remaining fourteen 20-second idle windows      | 1.22–1.39% renderer task time |
| Heap at first window / five minutes            | 54.09 MB / 49.09 MB           |
| DOM nodes / documents / frames throughout      | 3,865 / 1 / 1                 |
| Export / atomic restore of 39 financial tables | 0.113 s / 8.129 s             |
| Transaction count before / after restore       | 11,000 / 11,000               |
| Integrity after both imports and restore       | `ok`                          |

All fifteen idle windows retain a visible transaction view. The five-minute sample shows stable DOM size and no sustained heap growth; it cannot establish day-long memory behavior. The earlier immediate post-import query outlier does not recur in these five final samples after the sync batching changes.

The first settling window exceeds the 5% idle target, and first-row rendering exceeds the 2-second target by 0.113 s. These results remain visible in the report; neither establishes the three clean runs more than 20% above target required by the benchmark's regression rule. The steady idle workload meets its target, and the complete 10,000-row import meets the 90-second target. Requested CDP freezing still reports a visible page and 1.21% task time, so the actual hidden-tab target remains unverified.

## Final verification, 6 October 2026

The full Chromium sweep passes 43 tests with zero failures. Twenty-six existing checks remain skipped, plus two production-only tests run separately. The route review covers 88 Dutch/English layouts across light/dark themes and 1,440/393-pixel widths, including all eleven app routes and additional Planning/Settings tabs. It finds no browser errors, horizontal overflow, or WCAG AA violations. All ten mobile workflow/accessibility tests pass. The final targeted Chromium encrypted-reload and history tests pass; history pagination reaches all 61 records across four pages while keeping at most twenty rendered rows.

The rebuilt production site supports all 48 app, help, developer, and legal routes offline in each language. The checks start with a clean landing-to-app handoff, retain both scoped service-worker registrations, reload and unlock all eleven app routes, and fetch the OpenAPI document without a network. The complete EN/NL check has passed repeatedly.

WebKit passes two independent ten-page accessibility scans and two encrypted demo reload/unlock checks. Each reload preserves its exact transaction count, passes SQLite integrity checking, and retains encrypted, correctly aligned storage. The fixture mounts a unique OPFS subdirectory through the StorageManager prototype because this WebKit runner replaces wrappers and loses instance overrides. Teardown removes only that owned directory.

Final lint passes with zero errors and 22 existing warnings; typecheck, all 143 unit-test files / 1,751 tests, and the complete production build pass. Unit tests use two workers to keep timing-sensitive checks reliable alongside browser validation.

The final production web entry is 1,481,592 bytes (432,813 gzip), down 31.7% from the baseline raw entry size. The landing entry is 588,623 bytes (189,067 gzip), down 39.3%. Gzip sizes here use Node's default compression, matching the build report. Lazy-route precaching retains offline availability, so these reductions describe eager entry code rather than total download size.

## Reproduction and limits

Run `PERFORMANCE_BASE_URL=https://fluxby.local:5177/app/ PERFORMANCE_IDLE_WINDOWS=15 npm run benchmark:browser` against the HTTPS dev servers to repeat the five-minute sample. Set `PERFORMANCE_TRACE=true` for an idle timeline/CPU trace; `PERFORMANCE_OUTPUT` selects the report path. Use the same browser, hardware, backend, and workload for comparisons, and avoid concurrent builds/tests. Chromium needs an execution environment that permits its native process startup.

Local browser and source checks do not measure the native Tauri/WebKit process over a full day or physical peer-to-peer devices. Browser target percentages are renderer task-time fractions, not whole-machine CPU percentages. Production precaching downloads route assets to retain offline availability; the entry bundle reduction primarily reduces eager parsing and route mounting work. Historical/offline sync snapshot optimization needs persisted change tracking that preserves hard-delete tombstones.

## Continuation checklist — 5–6 October 2026

- [x] Recover the existing review, changes, measurements, and remaining checks.
- [x] Investigate post-import sync/query contention and fix offline cache gaps; repeat final OPFS measurements after storage fixes.
- [x] Repeat production offline navigation across app, help, and developer routes (EN/NL; repeat after database lifecycle fixes).
- [x] Complete Chromium workflows, bilingual desktop/mobile route review, and history paging checks: 43 Chromium passes, 10 mobile passes; production-only checks pass separately.
- [x] Fix WebKit partial-buffer OPFS writes, isolate disposable test storage, and repeat its encrypted startup and route review.
- [x] Run final lint, typecheck, full unit tests, and production build.
- [x] Repeat the complete isolated OPFS benchmark with five minutes of visible idle sampling; retain the complete report and target limitations.
- [x] Review the full diff, retain the final measurement artifact, clean task-created temporary files, and commit locally.

### Additional confirmed findings

- A retained transaction scope could accept a new write while COMMIT was pending, allowing writes to escape the transaction and overlap later root operations. Failed rollback also left an uncertain handle eligible for singleton reuse. Regression tests exercise acceptance boundaries and handle retirement.
- Encryption reinitialization closed the native SQLite handle outside its operation queue. Fresh HTTPS onboarding intermittently failed with an encrypted VFS physical-file-size error (1802); close must retire old wrappers and drain active operations before reopening.
- Database initialization callbacks shared one mount flag across effect lifetimes. A delayed unencrypted initializer could mark the app ready and replace its global database after encryption had already moved to a locked state. Use per-effect ownership for results and errors.
- Runtime service-worker cache writes were not attached to the fetch-event lifetime and could reject after a successful network response. Keep writes alive without blocking delivery, preserve cloned response bodies, and treat quota failures as nonfatal. Scope offline lookup to retained caches owned by the current deployment, and include generated HTML and stable-name asset contents in build revisions.
- Sync snapshot comparison can happen before acquiring the write transaction. Shared-clock batches can use one clock binding instead of repeating CASE comparisons; mixed batches preserve each monotonic clock. The 11,000-row native SQL benchmark improves from 80–91 ms to 8.3–8.5 ms across five runs. This is in-memory SQL CPU evidence; the final encrypted OPFS run separately verifies 2.9–3.8 ms immediate post-import queries.
- WebKit's writable stream writes the entire backing ArrayBuffer when given a partial Uint8Array view. A ten-byte view into an 8,192-byte buffer reproduces the problem without application code; an exact-size snapshot writes ten correct bytes. Plaintext SQLite writes from the WASM heap need the same normalization. Persistent WebKit profiles also share origin storage in this runner, so test fixtures must mount and clean only their own OPFS subdirectory.
- The exported SessionManager retained an anonymous visibility listener after every unlock and lost earlier activity handlers on repeated unlock. Own and remove both handler types, keep one active timer/listener set, and respect subscribers that lock during unlock. Five lifecycle regressions cover repeated cycles, visibility, and destruction. The current app uses EncryptionProvider instead of the legacy SecurityProvider, so this confirmed library leak is not evidence of the running app's heap growth.

Production offline reproduction: assemble with `npm run build:pages`, serve with `PORT=4177 node scripts/serve-pages.mjs`, then run `PLAYWRIGHT_BASE_URL=http://localhost:4177 PLAYWRIGHT_PRODUCTION=true npx playwright test e2e/offline-navigation.spec.ts --project=chromium --workers=1`. The two tests cover clean landing-to-app worker handoff, both registrations retained, all eleven encrypted app reloads, every help/developer route, legal pages, and the OpenAPI document without network access.
