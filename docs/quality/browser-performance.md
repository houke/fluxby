# Browser performance baseline

Run `PERFORMANCE_BASE_URL=https://fluxby.local:5177/app/ npm run benchmark:browser` against a local HTTPS development server. The command creates a fresh Chromium context and records startup, a 1,000-row and a 10,000-row CSV import, 100-row transaction queries, first-row rendering, visible and frozen idle work, and a backup/restore round trip. Set `PERFORMANCE_OUTPUT` to save the JSON report elsewhere; the default is `.nexus/tmp/app-review-performance/browser.json`. Set `PERFORMANCE_IMPORT_ROWS=1000` for a bounded run that still checks database integrity and restore. `PERFORMANCE_IDLE_WINDOWS=15` collects five minutes of visible idle work instead of the default three twenty-second windows; it verifies that the transaction view remains visible. It does not touch an existing browser profile.

These are engineering targets for the local machine, not release guarantees. Compare runs on the same hardware and browser, with no other test or build workload. Investigate a regression when a median exceeds its target by more than 20% on three clean runs.

| Measurement                                    |                 Target |
| ---------------------------------------------- | ---------------------: |
| Fresh launch to setup screen                   |                    3 s |
| Encrypted reload to lock screen                |                    1 s |
| Unlock to dashboard ready                      |                    2 s |
| Import 1,000 synthetic rows                    |                   10 s |
| Import 10,000 synthetic rows                   |                   90 s |
| 100-row transaction query, p95 of five samples |                 100 ms |
| First transaction row after navigation         |                    2 s |
| Visible idle renderer task time                | 5% of each 20 s window |
| Frozen idle renderer task time                 |    1% of a 10 s window |
| Backup/restore row count                       |            Exact match |

The synthetic rows include a quoted comma and escaped quotes. Query measurements are database timing, while first-row rendering includes UI work. The browser test uses a development build and its performance is not directly comparable with a production bundle. Browser console errors and failed stages remain in the JSON report so a partial measurement cannot be mistaken for a passing run.

The WebKit project uses disposable persistent profiles because ephemeral WebKit contexts on this Mac reject OPFS `getDirectory`. Each test mounts a unique owned OPFS subdirectory through the StorageManager prototype and removes only that directory during teardown. This isolates tests even when the browser runner shares origin storage across persistent profiles. WebKit covers route accessibility and encrypted reload/unlock with exact row counts and integrity checks.

## Current review, 6 October 2026

The [full performance review](performance-review.md) and [final JSON report](performance-browser-2026-10-06.json) supersede the historical measurements below. The final isolated encrypted OPFS run imports 1,000 rows in 1.548 s and 10,000 more in 65.939 s, then restores all 11,000 transactions across 39 tables in 8.129 s. Exact row counts and SQLite integrity checking pass, with no browser errors. Five immediate post-import 100-row queries take 2.9–3.8 ms. Across five minutes, steady visible renderer task time is 1.22–1.39%, DOM size stays constant, and heap falls from 54.09 MB to 49.09 MB.

The first settling window is 5.97%, above the 5% idle target; first-row rendering is 2.113 s, above its 2-second target. These remain recorded limitations rather than passing target claims. The five-minute sample does not establish native or day-long behavior. The complete 10,000-row import and steady idle workload meet their targets in this representative run.

The benchmark now verifies its storage backend and encryption, uses dates in the current month, checks exact import/restore counts, and reports measured sample durations. `PERFORMANCE_VFS_DIAGNOSTICS=true` adds disposable I/O and statement-category diagnostics; `PERFORMANCE_TRACE=true` saves a CPU timeline. The default frozen sample records a requested CDP lifecycle state and cannot establish actual hidden-tab activity. `PERFORMANCE_BACKGROUND_MODE=minimize` requires `document.hidden`; this Mac's automation environment leaves the page visible even after confirming the minimized window, so that check is environment-limited.

## Historical measurements, 29–30 September 2026

On 2026-09-29, a clean Chromium 153 context on the HTTPS development server completed the bounded 1,000-row run. Fresh setup took 1.67 s, encrypted reload to lock 0.31 s, and unlock to dashboard 1.21 s. CSV import took 4.50 s with all 1,000 rows imported and `PRAGMA integrity_check` returning `ok`. Five 100-row queries took 3.5–5.7 ms; first transaction row rendered in 1.08 s. Backup/restore of 26 tables took 6.76 s and preserved the 1,000 transaction rows.

A final-source repeat on 2026-09-30 imported all 1,000 rows in 4.40 s, returned `ok` from SQLite integrity checking, and restored 26 tables in 5.74 s with the transaction count unchanged. Setup, lock, and unlock took 1.59 s, 0.27 s, and 1.19 s respectively. Five 100-row queries took 3.4–10.5 ms, and the first row rendered in 1.05 s.

The three visible 20-second samples spent 21.78–24.42% of wall time in renderer tasks, above the 5% target. JavaScript heap was 56.79 MB initially and 48.74 MB at 60 seconds, so this run does not establish a growing heap. The frozen sample still reported 21.01% renderer task time; that result needs a separate lifecycle/profile investigation before attributing work to the app.

The repeat measured 23.94–26.45% visible renderer task time. Heap moved from 54.47 MB to 64.61 MB and then 59.22 MB across those windows; the short samples still do not prove a leak. Its frozen sample reported 24.85% task time, reinforcing the need to validate how CDP attributes frozen work.

The 10,000-row target is **unmet**. An isolated import advanced beyond 2,000 rows but slowed sharply; changing to 1,000-row SQL statements made a later `INSERT` exceed the 60-second database operation timeout. A separate 2026-09-30 run grouping five 200-row statements per transaction reached only 2,000 of 10,000 rows after 53 seconds, so that experiment was reverted. The implementation retains 200-row statements and transactions for bounded operation duration. The encrypted VFS page cache was corrected to distinguish simultaneous database and journal file handles after a reproducible `database disk image is malformed` failure. The bounded run verifies integrity and restore after that correction, but a complete 10,000-row integrity/restore result remains outstanding. Migration startup emits known duplicate-column console errors from idempotent migrations; those errors did not interrupt the bounded run.
