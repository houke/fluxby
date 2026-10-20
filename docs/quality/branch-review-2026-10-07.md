# Current branch review, 7 October 2026

Branch: `codex/app-review-improvements`. Review starts at `9ec4c63` and compares against the refreshed `origin/main` merge base. Changes and validation below are local; no push or deployment is part of this review.

## Checklist

- [x] Record starting branch, clean worktree, and review scope.
- [x] Review breaking contracts and existing-data upgrade compatibility.
- [x] Review storage, backup/restore, encryption, and migration safety.
- [x] Review API access, peer sync, accounting, and date behavior.
- [x] Review rendered UI across routes, languages, themes, desktop, and mobile.
- [x] Fix confirmed issues and add meaningful regressions.
- [x] Pass lint, typecheck, complete unit suite, production build, and browser workflows.
- [x] Record findings, compatibility limits, and final validation. Commit the reviewed changes locally.

## Findings

Confirmed issues fixed so far:

- Profile sync omitted legacy transactions with a NULL profile ID even when their account belonged to the paired profile. NULL ownership also let an incoming ID overwrite an unassigned local row. Scoped ownership now includes account-owned legacy transactions and rejects foreign or unassigned collisions.
- Sync snapshot reads ran before transaction ownership, allowing a newer queued local edit/clock to be overwritten. Snapshot comparison and finalization now run on the scoped connection.
- Peer cleanup left retry timers alive, allowing signaling initialization after lock/profile changes; disconnection also left acknowledgements waiting, asynchronous key exchange alive, and stale pairing approvals actionable. Cleanup now cancels pending work and verifies the current open connection.
- A local mutation during an active sync could be lost from the automatic delivery schedule. Automatic sync now queues a follow-up after the active request completes.
- Encrypting larger full snapshots exceeded JavaScript's spread-argument limit during Base64 encoding. Encoding now uses bounded chunks, with a large-payload encrypted round-trip regression.
- Full profiles above 50,000 rows were rejected by both transport and the data adapter. Capable peers now send bounded encrypted frames; the receiver reassembles one snapshot and applies it atomically before acknowledgement. Aggregate partial/processing reservations stay bounded to 32 million serialized characters and four snapshots, with a five-minute transfer timeout. Older v2 peers retain small-packet compatibility; larger transfers require both peers to advertise framing after fresh pairing. A native 50,001-row regression verifies exact application and rollback of all 50,000 preceding rows when the final reference is invalid.
- Completing a monthly review could use one profile's checklist to update another profile after an asynchronous switch. The action now captures and checks profile ownership around reads and transactional writes; both race reproductions fail before the fix and pass afterwards.
- Import failure toasts could expose raw English exceptions in Dutch mode. Failure feedback now uses the existing translated messages; bilingual regressions preserve the chosen language.
- The optional HTTP client had no way to provide the newly required remote bearer token. It now exposes session-only `setApiAuthToken`, with documented setup and no persistent token storage.
- Public-page demos extended eight pixels beyond the mobile viewport. The container now matches the page gutter. Button, badge, animation, navigation, and architecture text contrast is corrected; overflowing code examples accept keyboard focus and ArrowRight scrolling.
- Long Dutch category titles had roughly 60 pixels left after actions and an inline count. The count now wraps independently; category editor icon/color pickers, keyword controls, and save/cancel buttons have localized accessible names, pressed states, and tooltips. Parent-category selects now have localized names, and keyword badges meet contrast requirements.
- Dependency audits found affected versions of `proxy-addr`, `source-map-js`, `postcss-selector-parser`, `shell-quote`, and `sharp`. The lockfile now resolves patched releases; targeted overrides replace the old parser and shell-quote versions pinned by Typography and Concurrently. All parent packages retain their existing versions. Full npm audit now reports zero vulnerabilities.
- Browser harness assumptions are explicit: history fixtures need Vite source-module access, and production help navigation accepts GitHub Pages' expected 404 SPA handoff while still verifying the restored article and URL.

## Compatibility and upgrade notes

This branch cannot be described as having zero breaking changes against released `main` (`bca98cc`). It deliberately changes these contracts:

- The optional developer API defaults to loopback, disables trust of forwarded client addresses, requires `API_ALLOW_REMOTE=1` and `API_AUTH_TOKEN` (at least 32 characters) for remote `HOST`, and rejects wildcard `CORS_ORIGIN`. Browser clients need an explicitly allowed origin and bearer header, including health and documentation requests. See [API access](../../apps/api/API_ACCESS.md).
- Peer sync changes from protocol v1 to v2 and requires matching schema versions. Upgrade both devices and approve a fresh pairing. Stored pairing entries remain display metadata and do not restore authorization after reload (also true on main). Physical multi-device compatibility is not established by local tests.
- Async database transaction callbacks must use their supplied connection. Calling the original database inside the callback queues behind the same transaction. Repository callers are migrated; consumers of `@fluxby/database` need to update their callbacks.
- Core peer callbacks now await database commits and return applied counts. `PeerOptions.onSyncReceived` changes from a void callback to `Promise<number>`; `sendChanges`/`requestSync` return acknowledged promises. Library consumers must await delivery and adapt their callbacks.
- Schema 14 upgrades to schema 23 preserve main-era financial and identity rows. Migration 17 intentionally removes splits/reconciliation/change-history tables introduced only on intermediate versions of this branch; version-16 backups retain bank transactions but discard those retired feature tables. Upgrading intermediate branch data therefore removes that retired data.
- Financial JSON exports use the v3 `tables`/manifest format instead of main's flat v2 structure. Integrations that parse exports directly need to handle the new shape. A regression using main's exact flat v2 keys verifies legacy preview/restore, preservation of included records, device retention, and clean foreign-key checks. Collections main did not export are disclosed as missing in the preview.

Fresh install, populated schema-14 upgrade, schema-14 backup restore, and a simulated failed migration are covered by dedicated compatibility regressions. The failure leaves schema/version/data unchanged.

## Validation

Final fresh verification:

- App UI: both language audits pass, covering 88 route layouts plus Planning/Settings tabs, light/dark, and 1,440/393-pixel widths; zero page errors, horizontal overflow, or axe WCAG AA violations.
- Category UI: both language regressions pass across 24 list/create/edit states, including open tooltips, parent-select names, pressed states, contrast, and long-title wrapping.
- Public UI: both language regressions pass across 40 landing/help/developer states, including real keyboard scrolling of overflowing code.
- Production offline: both Dutch/English regressions pass, covering all 48 app/help/developer/legal routes, previously unvisited lazy chunks, encrypted lock/unlock, and worker scope handoff.
- Final lint passes with zero warnings/errors, typecheck passes, and the complete unit suite passes 148 files / 1,797 tests with `--maxWorkers=1`. Production monorepo and assembled Pages builds pass after the dependency patches. `npm audit` reports zero vulnerabilities across production and development dependencies. Existing large-bundle and Node adapter browser-externalization warnings remain build diagnostics.
- The broad production Chromium/mobile/WebKit run passed 49 workflows and skipped 28, with three harness failures: two Pages SPA handoff assumptions and one source-module history fixture. Both help cases pass after the handoff correction; the history case passes on Vite and now skips production explicitly. Existing skips remain unverified coverage. Encrypted physical OPFS reloads pass on Chromium and WebKit with integrity, record-count, physical-header, and page-size assertions. The source-module history regression passes on the stable HTTPS snapshot. Native desktop and physical multi-device sync are not exercised by this review.

Historical review results are context only and are not validation for this review.

## Reproducibility and scope

Concurrent unrelated documentation, localization, and motion edits appeared in this checkout during the review. The concurrent work was committed separately as `f30c1b7`. Final validation uses an isolated snapshot of that commit plus the review fixes; this review preserves the separate commit and any unrelated staging. Further Settings work appeared during final validation and is outside the review commit. The temporary HTTPS harness allows the shared WASM dependency explicitly; this is a harness setting and is not a repository configuration change.

Parallel unit attempts hit load-related timeouts and intermittent localhost API fixture responses. The final serial suite passes unchanged assertions. Browser checks wait for tooltips to finish animating before inspecting contrast. A dev HMR provider mismatch and the temporary snapshot's WASM serving restriction were resolved by using a stable source snapshot and its dedicated harness.

Dependency patch references: [proxy-addr](https://github.com/advisories/GHSA-jqcg-44mw-7w3h), [source-map-js](https://github.com/advisories/GHSA-68fv-2mgg-jv7q), [selector parser](https://github.com/advisories/GHSA-rj75-hqrm-r3gf), [shell-quote](https://github.com/advisories/GHSA-pqg4-j6r4-53mv), [sharp](https://github.com/advisories/GHSA-wq5f-xc86-pv6w). Remove the targeted overrides when the parent packages release compatible dependency pins.

The final production matrix passes all ten tests: both language variants of app layouts/tabs, category forms, public accessibility, offline navigation, and workflow help. The stable HTTPS matrix passes three tests: Chromium and WebKit encrypted OPFS recovery, plus bounded large-history navigation. No unresolved reproducible defect remains in the reviewed snapshot; the compatibility changes and platform limits above remain applicable.

Retained evidence: [validation record](assets/branch-review-validation.json), [English category editor](assets/branch-review-categories-en-desktop.png), [Dutch mobile category list](assets/branch-review-categories-nl-mobile.png), and the four app screenshots in this directory.
