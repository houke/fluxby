# Dutch finance workflows and app review

Review started 2 October 2026 and completed 3 October 2026 on `codex/app-review-improvements`, baseline `176351f`.

The original comparison is preserved in [the research report](../research/personal-finance-tracker-comparison.md), against `gillespiejameson/personal-finance-tracker` at `a3cc0258076f3e4ddbc9b7b820d09fcd7285a09a`. The local implementation plan is `.nexus/features/dutch-finance-workflows/plan.md`. Most planned code landed in `822d9e3`, but the execution checklist was left in progress and the feature was missing from the Nexus index. This review reconciles that record with current source and runtime evidence. The earlier comparison describes a historical checkout, not current missing features. This tracked report is the durable delivery checklist; `.nexus/` remains local and ignored.

## Recovery and validation checklist

- [x] Locate comparison, delivery plan, execution tracker and landed implementation.
- [x] Inspect current branch and clean baseline; preserve local-only delivery.
- [x] Assign import, transaction and planning reviews using the repository's Nexus delegation workflow.
- [x] Establish baseline: lint, type checking and 110 files / 1,538 tests passed.
- [x] Reconcile every active comparison item with current implementation and limitations.
- [x] Fix confirmed import/recovery defects and normalize controls.
- [x] Fix confirmed review/refund/manual-bill/export defects and normalize controls.
- [x] Fix confirmed planning/budget/category/account defects and normalize controls.
- [x] Verify registered migrations, backup, sync, reset and demo contracts; asynchronous profile safeguards are included in the domain fixes below.
- [x] Review all 11 application routes in English and Dutch, light/dark, desktop/mobile.
- [x] Exercise primary interactions, empty/error states, onboarding and help destinations.
- [x] Run final lint, type checking, complete tests and relevant browser regressions.
- [x] Reconcile remaining roadmap tasks, publish review evidence and update Nexus status.
- [x] Commit validated task files locally; report commit and remaining boundaries.

## Comparison checklist

A checked item requires evidence for the approved Dutch/local-first scope. **29 items are verified; six broader items are partial**, with their outstanding work listed below. Broader competitor parity, bank certification and external acceptance remain separate tasks. The core/UI review is complete; the expanded finance roadmap remains in review.

- [x] G03 — Named, reusable import profiles with header signatures and backup/sync.
- [x] G04 — Explicit delimiter/date/decimal/sign/debit-credit/introductory-row controls; preview matches commit.
- [x] G05 — Offline fuzzy-duplicate suggestions requiring user review.
- [x] G08 — Pre-import recovery snapshots and exact batch undo preserving later work.
- [x] G09 — Full filtered CSV export with NL/EN format, quoting and formula protection.
- [x] G10 — Persisted actionable transaction exception queue.
- [x] G11 — Keyboard/pointer review, later decisions and bounded undo.
- [ ] G12/NL04 — Partial: confirmed refunds/reimbursements, partial/multiple links and consistent accounting work; category inheritance remains open.
- [x] G14 — Dated household expense reserves, with no double-counted payments.
- [x] G15 — Daily 30/60/90-day forecast, floor breach/shortfall and stale-input visibility.
- [x] G16 — Historical net-worth snapshots distinguish missing history from zero.
- [ ] G17 — Partial: dismissible local anomaly reasons work; detector-specific evidence, merchant identity and calibration remain open.
- [ ] G18 — Partial: persisted weekly checks, links and streak calculation work; richer guided flow/history/reminders remain open.
- [x] G19 — Per-account statement freshness beside balances/forecast, distinct from device sync.
- [x] G20 — Cash/loan/investment account semantics without mandatory IBANs.
- [x] G22/NL03 — Multiple monthly/four-week/one-off income schedules and daily guidance.
- [x] G23 — Independent month budget overrides and previous-month copy.
- [x] G24 — Optional monthly income allocation with unassigned amount and needs/wants/savings.
- [x] G25 — Fixed/variable category classification used consistently.
- [ ] G26 — Partial: monthly historical suggestions work; category-attributed commitment suggestions remain open.
- [x] G27 — Explicit surplus/both rollover policy with dated allocations.
- [x] G28 — Deadline-based monthly goal guidance, overdue/completed handling.
- [ ] G29 — Partial: linked contributions share a cap across goals and paired transfers; manual-entry deduplication and category-derived funding remain open.
- [x] G30 — Cash-flow waterfall with fixed/variable/savings semantics.
- [x] G31 — Selectable 3/6/12-month baselines and comparable partial-month totals.
- [x] G32 — Direction-aware rules, provenance and deliberate-review protection.
- [ ] G33 — Partial: confirmed persistent pairing works; closest-date one-to-one candidate assignment remains open.
- [x] G37 — Account colors, accessible display and persistence.
- [x] G38 — Manual bill creation before repeat history; signed expense values and planning visibility.
- [x] G39 — Category dependency preview/reassignment/retirement and goal archiving.
- [x] D02 — Advanced field/mode/amount/account/direction rule controls and preview.
- [x] NL01 — Synthetic regression coverage for ING/ASN/Rabobank/ABN layouts; representative customer exports still required for certification.
- [x] NL05 — Preserve optional supplied SEPA/counterparty references.
- [x] Cross-cutting — Registered migrations and backup/sync/reset contracts for stored features.
- [x] Cross-cutting — Bilingual UI/help/demo and onboarding anchors for active features.

## Conditional and deferred work

- [ ] NL01 certification: obtain sanitized representative consumer exports per bank/product/version/language/encoding and prove normalization, overlap handling and recovery against them.
- [ ] NL02: evaluate CAMT.053/MT940 adapters only after representative exports and demonstrated demand; do not enable unverified parsers.
- [ ] NL06: authenticated Dutch-bank coverage/cost/consent assessment and sandbox proof, pending provider choice and credentials. Preliminary architecture is documented in `docs/research/dutch-bank-feeds.md`.
- [ ] G18 extension: inline review queue/spending pace/upcoming bills and optional reminders.
- [ ] G26 extension: map planned commitments to categories before combining bill/reserve/goal guidance into per-category suggestions.
- [ ] G22 extension: inferred payday and weekly/biweekly/twice-monthly schedules beyond the prioritized Dutch monthly/four-week/one-off flows.
- [ ] G29 extension: category-derived goal funding and identifying/deduplicating an existing manual contribution when linking the same money.
- [ ] NL05 extension: typed extraction of optional supplied mandate/creditor/payment references and using them as matching evidence; raw supplied fields are preserved today.
- [ ] G11 extension: multiple ranked category suggestions beyond the current single suggestion.
- [ ] G12 extension: category inheritance from the original purchase after confirming a refund.
- [ ] G17 extension: detector-specific explanations, IBAN/contact/provider identity resolution, a large-amount condition for first-time merchants and representative Dutch threshold calibration.
- [ ] G33 extension: one-to-one minimum-date-distance transfer candidate assignment with preferential own-IBAN evidence.

G07 pending bank feeds depends on NL06. G13 debt optimization and G35/G36 wall/remote displays remain explicitly deferred. G21 transaction splits remains excluded following its retirement. D01 is an observation, not authorization for a storage-unit migration. D03/D04 are architectural/product differences, not missing features to copy.

## App review evidence

The final route scan passed on 3 October 2026: all 11 application routes in NL/EN, light/dark, 1440/393 px, plus every Planning and Settings tab. This is **88 route layouts and 144 WCAG A/AA scans**. No axe violations, JavaScript page errors, document/main overflow or shifted headers/panels remained. Loaded contacts/transactions and the top/middle/bottom of scrolling pages were inspected, with visual checks of forms, empty import history and settings/planning tabs.

Representative screenshots use disposable demo profiles: [Dutch light desktop](assets/dutch-workflows-desktop.png) and [English dark mobile](assets/dutch-workflows-mobile.png). The automated scan is reproducible with `e2e/app-style-review.spec.ts`; meaningful flows also live in `e2e/dutch-import-workflows.spec.ts`, `e2e/household-planning.spec.ts`, `e2e/transaction-review.spec.ts`, `e2e/accessibility.spec.ts` and `e2e/workflow-help.spec.ts`.

The review exposed real contrast, mobile overflow, obstructed selection actions, import-undo and weekly-checklist defects, all corrected below. Obsolete net-worth/budget/import test selectors were aligned with the current controls. Test setup now waits for asynchronous first-run initialization and dialog entrance animation. Earlier runs against another checkout's proxy were discarded; current-source review used isolated ports 5197/5198 with served-source verification.

### Confirmed defects and corrections

- Import mapping: debit/credit-only files enabled an inert Start action; saved header signatures accepted changed casing while keeping invalid original mapping keys. Source mappings now rebind and validate, and previews show the normalized signed EUR values that commit.
- Recovery: real imports rejected the unsupported `undone` database status. History now derives undo state from the batch while retaining a legal import row. Undo preserves later imports, blocks later manual balance edits atomically and requires newest-first undo when successive bank statements contain authoritative running balances.
- Profile isolation: capture ownership before asynchronous validation and guard writes/commit; reset feature drafts on profile switches. Import completion and recovery membership are checked together.
- Review and bills: undo restores prior decisions/category provenance in a bounded stack; ancillary query failures disable dependent actions. A manually created expense bill now stores negative amounts and remains visible in the household forecast. Month-end and leap-day due dates clamp correctly. Migration 022 repairs existing manual bills; backup restore and peer sync normalize legacy input without changing detected recurring income.
- Budgeting and goals: historical suggestions only edit the selected monthly allocation; yearly limits stay outside monthly totals. Opted-in deficit carry resets at a zero-allocation month. Both halves of a paired transfer share a contribution cap across goals. Fixed parent category classification matches cash-flow/forecast semantics.
- Weekly review: capture the checkbox value before the deferred mutation; normalize week selection to Monday.
- Shared UI: use shared forms/cards/currency, plain sentence-case titles, consistent mobile spacing, explicit account-color saving and global settings toasts. Account colors and all account kinds propagate through balances and transactions.
- Accessibility and layout: correct measured label contrast, dark dialog surfaces, icon action names/tooltips, keyboard collapsible panels and mobile selection/Undo controls. Both floating controls now use body portals above bottom navigation and below dialogs. Named address-book row actions work before tooltip focus, and the shared close tooltip preserves single-Escape dismissal. Account scrollers and header date controls shrink to the available width; transaction-card buttons shrink beside their checkbox. Main-panel, header and hidden-ancestor alignment are checked alongside page overflow.

### Validation

- `npm run lint`: passed, **0 errors / 12 existing warnings** (baseline: 55 warnings).
- `npm run typecheck`: passed for packages, web, API and landing.
- `npm run test:run`: **121 files / 1,601 tests passed** on Node 24.21.0.
- `npm run build`: production packages/API/web/landing build passed; existing Vite chunk-size warnings remain.
- `git diff --check`: passed.

Browser validation combined the full run with focused reruns after corrections: **53 distinct cases passed** across Chromium, WebKit and mobile. The six original full-run failures were resolved/rechecked; two additional actual deletion/Undo cases passed. The final route scan also passed separately in both languages. The full browser inventory contains **26 existing skipped cases**: 15 legacy bulk-delete placeholders and 11 peer-sync cases whose required UI fixtures are unavailable. Current selection, confirmation, focus/Escape, actual deletion/Undo, import recovery, household planning, recurring expansion, seed language, export/manual bills and help workflows are checked separately.

The optional API multi-tenant harness now binds one server explicitly to IPv4 loopback and closes it afterward. A deterministic macOS listener-collision reproduction explained how Supertest could reach an unrelated IPv4 service while its intended server listened on IPv6; the original transient 401 was not captured with enough context to prove that exact cause. Production authentication was not changed, and every profile-isolation assertion remains.

The repeated-delete benchmark was unstable when comparing a few sub-millisecond samples. It now warms up, compares medians of larger equal workloads, verifies every deletion count and retains both the 3x sustained-degradation limit and the existing five-second absolute limit.

### Evidence and acceptance boundaries

Domain regressions cover historical manual-bill sign repair/backup/sync, month-end due dates, dialog Escape veto, named contact actions, import normalization/recovery, real persisted import rows, profile switching, refund/reimbursement accounting, review undo, sync identity remapping, month envelopes/carry, category retirement, goal caps, settings feedback and keyboard forms. Registered migrations 018–022 and schema-driven backup/reset/demo contracts were inspected; dedicated backup/profile-sync/household-demo checks passed.

Source checks and automated browser review do not certify live AI/provider responses, native packaging, physical multi-device WebRTC, representative customer-bank exports, or production deployment. Existing browser cases skipped by the repository are reported separately rather than counted as passes. Richer roadmap extensions above remain unchecked.
