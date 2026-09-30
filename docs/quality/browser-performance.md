# Browser performance baseline

Run `PERFORMANCE_BASE_URL=https://fluxby.local:5177/app/ npm run benchmark:browser` against a local HTTPS development server. The command creates a fresh Chromium context and records startup, a 1,000-row and a 10,000-row CSV import, 100-row transaction queries, first-row rendering, visible and frozen idle work, and a backup/restore round trip. Set `PERFORMANCE_OUTPUT` to save the JSON report elsewhere; the default is `.nexus/tmp/app-review-performance/browser.json`. Set `PERFORMANCE_IMPORT_ROWS=1000` for a bounded run that still checks database integrity and restore. It does not touch an existing browser profile.

These are engineering targets for the local machine, not release guarantees. Compare runs on the same hardware and browser, with no other test or build workload. Investigate a regression when a median exceeds its target by more than 20% on three clean runs.

| Measurement | Target |
| --- | ---: |
| Fresh launch to setup screen | 3 s |
| Encrypted reload to lock screen | 1 s |
| Unlock to dashboard ready | 2 s |
| Import 1,000 synthetic rows | 10 s |
| Import 10,000 synthetic rows | 90 s |
| 100-row transaction query, p95 of five samples | 100 ms |
| First transaction row after navigation | 2 s |
| Visible idle renderer task time | 5% of each 20 s window |
| Frozen idle renderer task time | 1% of a 10 s window |
| Backup/restore row count | Exact match |

The synthetic rows include a quoted comma and escaped quotes. Query measurements are database timing, while first-row rendering includes UI work. The browser test uses a development build and its performance is not directly comparable with a production bundle. Browser console errors and failed stages remain in the JSON report so a partial measurement cannot be mistaken for a passing run.

The WebKit accessibility project uses one disposable persistent profile. Playwright's ephemeral WebKit contexts on macOS reject OPFS `getDirectory`, while persistent WebKit profiles support it. Keep WebKit's page scan as one test until the browser runner can isolate persistent storage across separate tests; Chromium and mobile projects cover the stateful workflows.

## Current measurement

On 2026-09-29, a clean Chromium 153 context on the HTTPS development server completed the bounded 1,000-row run. Fresh setup took 1.67 s, encrypted reload to lock 0.31 s, and unlock to dashboard 1.21 s. CSV import took 4.50 s with all 1,000 rows imported and `PRAGMA integrity_check` returning `ok`. Five 100-row queries took 3.5–5.7 ms; first transaction row rendered in 1.08 s. Backup/restore of 26 tables took 6.76 s and preserved the 1,000 transaction rows.

A final-source repeat on 2026-09-30 imported all 1,000 rows in 4.40 s, returned `ok` from SQLite integrity checking, and restored 26 tables in 5.74 s with the transaction count unchanged. Setup, lock, and unlock took 1.59 s, 0.27 s, and 1.19 s respectively. Five 100-row queries took 3.4–10.5 ms, and the first row rendered in 1.05 s.

The three visible 20-second samples spent 21.78–24.42% of wall time in renderer tasks, above the 5% target. JavaScript heap was 56.79 MB initially and 48.74 MB at 60 seconds, so this run does not establish a growing heap. The frozen sample still reported 21.01% renderer task time; that result needs a separate lifecycle/profile investigation before attributing work to the app.

The repeat measured 23.94–26.45% visible renderer task time. Heap moved from 54.47 MB to 64.61 MB and then 59.22 MB across those windows; the short samples still do not prove a leak. Its frozen sample reported 24.85% task time, reinforcing the need to validate how CDP attributes frozen work.

The 10,000-row target is **unmet**. An isolated import advanced beyond 2,000 rows but slowed sharply; changing to 1,000-row SQL statements made a later `INSERT` exceed the 60-second database operation timeout. A separate 2026-09-30 run grouping five 200-row statements per transaction reached only 2,000 of 10,000 rows after 53 seconds, so that experiment was reverted. The implementation retains 200-row statements and transactions for bounded operation duration. The encrypted VFS page cache was corrected to distinguish simultaneous database and journal file handles after a reproducible `database disk image is malformed` failure. The bounded run verifies integrity and restore after that correction, but a complete 10,000-row integrity/restore result remains outstanding. Migration startup emits known duplicate-column console errors from idempotent migrations; those errors did not interrupt the bounded run.
