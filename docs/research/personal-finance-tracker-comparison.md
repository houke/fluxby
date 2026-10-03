# Personal Finance Tracker vs Fluxby — Dutch priorities

Temporary product comparison — 30 September 2026

Preserved from the original local comparison on 2 October 2026. This document is historical research. Current implementation status, validation and remaining tasks are tracked in [Dutch finance workflows and app review](../quality/dutch-workflows-review.md).

Current scope: Dutch users and Dutch bank accounts. This version contains only recommendations relevant to that scope. Existing G identifiers are retained for continuity, so numbering has gaps.

## Scope and evidence

Compared [gillespiejameson/personal-finance-tracker](https://github.com/gillespiejameson/personal-finance-tracker) at `a3cc0258076f3e4ddbc9b7b820d09fcd7285a09a` with Fluxby's current local checkout, last recorded HEAD `dc086c3e4ec35081b5e9bcb76a112d442905e70c`, including existing uncommitted work. The checkout changed during this review as other work was committed; this is a comparison of the files inspected, not a claim about Fluxby's deployed release. In particular, Planning, savings goals, safe-to-spend, net worth, monthly reviews, saved transaction views and budget rollover already exist locally. Transaction split tools have been explicitly removed by migration 017.

Method: inspected their README, architecture guide, route inventory, feature components, server actions, domain functions and schema; compared against Fluxby's routes, UI, data services, types, migrations and platform code. CodeGraph was consulted first for Fluxby. GitHub's web fetch failed, so the public repository was fetched directly with Git and inspected at the pinned commit. No application was launched, no bank account was connected, and no tests were run: **“implemented” means supported by source and a reachable UI/action, not runtime-certified.** “Missing” means no equivalent was found in the current implementation, not proof that none could exist elsewhere. Their design plan was not treated as evidence of shipped functionality.

This is a broad inventory of meaningful product differences, including small workflow differences and technical foundations. It does not count every visual detail, dependency or bug as a feature. Scores are product/engineering judgments for Dutch consumers, with EUR-based local finance tracking. Dutch and English UI remain available for users in the Netherlands. Related rows share implementation work and must not be added together as independent estimates.

## Scoring

- **Value /10:** incremental benefit to our Dutch target users beyond what Fluxby already has. 9–10 = major everyday benefit; 7–8 = strong; 5–6 = useful for a subset; 3–4 = limited/niche; 1–2 = little benefit or undesirable as implemented.
- **Fit /10:** how naturally the capability integrates into Fluxby's current browser/OPFS, React, profile and peer-sync architecture. 9–10 = close fit using existing foundations; 7–8 = moderate additions; 5–6 = substantial schema or cross-feature work; 3–4 = major adaptation; 1–2 = architectural mismatch.
- **Size:** S = focused UI/pure-function work; M = a feature across UI/service/persistence; L = several features or a migration spanning analytics/sync/backups; XL = a new platform/service dependency. These are relative scope, not delivery dates.
- Fit scores assess implementing the **idea**, not copying their code. Shared React/TypeScript helps, but their Next.js server actions and synchronous Drizzle/better-sqlite3 calls cannot run unchanged in Fluxby's browser worker database.

## Dutch product direction

**Prioritize reliable Dutch bank imports, understandable household cash flow, and local control of financial data.** Adapt useful workflows from the competitor to Dutch bank statements and household finances.

- **Verify Dutch bank coverage bank by bank.** Preserve ING/ASN and target Rabobank and ABN AMRO next, followed by other banks justified by user demand and representative exports. This order is a product proposal, not a measured market-share ranking. Separate personal and business account support; a bank's business-format documentation is not proof that the same format is available to consumers.
- **File import remains a first-class experience.** Improve saved mappings and actual Dutch statement formats before introducing a bank-feed dependency. Rabobank's consumer guide confirms CSV export. ABN AMRO's business guide documents TXT, MT940 and CAMT.053 among its formats; validate its consumer exports independently. [Rabobank consumer export][NL-rabo]; [ABN AMRO business formats][NL-abn].
- **Dutch statement conventions and EUR totals.** Support decimal commas/points according to the file, separator variants, Dutch/English headers, IBAN counterparties and unambiguous dates. Clearly reject unsupported transaction currencies rather than silently adding them to EUR totals; currency conversion is outside this plan.
- **Household planning before specialized debt optimization.** Prioritize fixed expenses, reserves for annual/irregular costs, configurable income timing, refunds/reimbursements and a useful cash forecast. Example scenarios include rent/mortgage payments, insurance, utilities, municipal bills, holiday allowance and shared expenses; these are proposed test/demo scenarios, not universal assumptions about every Dutch user.
- **Keep our local-first distinction.** Local import, classification, review and forecasting should work without a bank-feed or AI account. Optional connected features need a clear data path and must not make a server necessary for the core product.

### Revised priorities

| Rank | Addition | Value | Fit | Dutch rationale |
|---|---|---:|---:|---|
| 1 | Dutch bank coverage, reusable mappings and robust locale parsing (NL01, G03–G04) | 9–10 | 8–9 | Makes the core product usable with more local banks and avoids repeated mapping work. |
| 2 | Import recovery, local duplicate/refund review and reimbursement handling (G05/G08/G10/G12, NL04) | 8–9 | 7–9 | Builds trust in bank data; distinguishes repayments from income and accidental duplicates. |
| 3 | Fixed/irregular expense reserves and manual recurring bills (G14/G25/G38) | 8–9 | 8–9 | Supports household commitments without waiting for long transaction histories. |
| 4 | Account freshness and daily cash forecast (G19/G15) | 8–9 | 7–9 | Shows when the cash balance may become too low and whether the input data is current. |
| 5 | Goal guidance and configurable income timing (G28/G22, NL03) | 8 | 8–10 | Extends existing Planning; distinguish calendar-month and four-week schedules. |
| 6 | Filtered CSV export with Dutch/English options (G09) | 8 | 10 | Small parallel delivery for spreadsheets and sharing selected records. |
| 7 | CAMT.053, then MT940 where target-bank exports justify it (NL02) | 7 | 7 | Verify structured exports from Dutch banks where they help; do not delay consumer CSV coverage. |
| 8 | Broader spending alerts and historical net worth (G17/G16) | 8 | 8 | Useful once import quality and shared calculations are reliable. |

**Later, if Dutch users need them:** product-specific debt planning (G13) and wall/remote-display features (G35/G36). Keep bank-feed research specific to Dutch institutions and separate from the core file-import roadmap (NL06).

## A. Capabilities absent from Fluxby, or absent in this specific form

### Import, export and transaction quality

| ID | What they have | Fluxby today / precise gap | Value | Fit | Size | Integration approach and evidence |
|---|---|---|---:|---:|---|---|
| G03 | Named, reusable import profiles, recognized by a saved header signature | We auto-detect known headers and offer generic/AI-assisted mapping, but the chosen custom mapping is component state rather than a saved reusable bank profile. | 9 | 9 | M | Persist mappings per financial profile and bank/export signature. Support Dutch and English headers without duplicating bank identity; retain file locale settings and version changes. Include mappings in backup/sync. [Their save flow][T-import]; [our mapping][F-import]. |
| G04 | Explicit date format, debit/credit columns, amount sign convention and leading-row skipping in the mapping wizard | Our mapping offers amount and direction columns plus heuristics, but no equivalent full set of user controls. | 9 | 8 | M | Extend the wizard/worker with explicit date, separator, decimal, sign and debit/credit controls. Preview normalized values; reject ambiguous dates or amounts instead of silently choosing a locale. [Their wizard][T-mapping]; [our wizard][F-import]. |
| G05 | Automatic local fuzzy-duplicate flags during import | We have exact dedupe and a TypeSafe-dependent semantic duplicate service; no equivalent built-in local import-time fuzzy review flag was found. | 8 | 9 | M | Same amount + nearby dates + text similarity can generate review candidates offline. Flag rather than silently delete. Their defaults are ±3 days and similarity ≥0.85. [Their algorithm][T-dedupe]; [our `findSemanticDuplicates`][F-service]. |
| G07 | Pending bank transactions becoming posted records using external IDs; vanished pending records removed | Our transaction model has no equivalent bank-feed lifecycle. Import-job “pending” status is unrelated. | 6 | 5 | L | Defer until a Dutch-bank feed adapter (NL06) or actual target-bank export requires it. Add provider identity and pending/booked reconciliation per connector; do not assume identical fields or lifecycle across banks. [Their sync][T-sync]; [their schema][T-schema]; [our service][F-service]. |
| G08 | Automatic rotating database backup before statement rows are committed, and one-click undo of that import | We have encrypted/manual backups, recovery snapshots for restore, and transaction deletion undo; no equivalent CSV-import checkpoint plus batch undo found. | 9 | 7 | L | Use our backup infrastructure and durable import-batch membership. A browser cannot copy their SQLite file directly. Undo must preserve later edits and keep balances, categories, subscriptions and sync consistent. Their retention is 20 files; their backup runs after setup helpers, so this is not literally a snapshot before every possible write. [Backup][T-backup]; [import flow][T-import]; [undo action][T-undo]; [our backup UI][F-backup]. |
| G09 | Filtered transaction CSV download | We export full financial backups; no filtered transaction-table CSV action found. | 8 | 10 | S | Export all filtered results, with NL/EN headings, an explicit delimiter/decimal convention and UTF-8. Include currency and useful counterparty fields; provide correct quoting and spreadsheet-formula protection. [Their export][T-export]; [our transactions][F-transactions]; [our backup export][F-backup]. |
| G10 | Dedicated actionable review queue for uncategorized rows, possible duplicates and suspected refunds | We have uncategorized filtering, category suggestions and a monthly checklist, but no combined exception inbox with a persisted reviewed state. | 9 | 8 | M | Add typed review reasons and explicit accept/reject/later decisions alongside the transaction view. Reuse existing categorization and transfer actions. [Their queue][T-queue]; [our transactions][F-transactions]; [monthly review][F-planning-ui]. |
| G11 | Keyboard-driven one-at-a-time review, top category suggestions, “later” and a bounded undo stack | Our global Spotlight search and transaction actions do not provide this focused review interaction. | 7 | 8 | M | Layer over G10; keep keyboard and pointer actions equivalent. Their stack holds 20 entries, and undoing a row does not undo a learned rule's effects on other rows. Do not promise whole-batch undo. [Their screen][T-review]; [our Spotlight][F-spotlight]. |
| G12 | Suspected refund matching to an earlier purchase, with confirm/reject and category inheritance | No linked refund workflow found. A positive transaction can be categorized, but it is not linked to its original expense. | 9 | 7 | L | Link confirmed refunds to purchases and reflect them consistently in budgets/analytics. Preserve a separate reimbursement decision (NL04): an incoming Tikkie/payment request settlement is not automatically a merchant refund or salary. Their same-merchant/account heuristic remains only a candidate. [Their matching][T-refund]; [our service][F-service]. |

### Planning, wealth and awareness

| ID | What they have | Fluxby today / precise gap | Value | Fit | Size | Integration approach and evidence |
|---|---|---|---:|---:|---|---|
| G13 | Debt payoff planner: APR, minimum payments, extra payments, avalanche vs snowball, payoff dates, total interest, chart and stalled-debt handling | We track manual liabilities in net worth, but no debt terms or repayment simulation. | 6 | 5 | L | Later, optional debt planning. Start with user-entered balance, interest and agreed payments; assess Dutch personal loans, overdrafts, student loans and mortgages individually before claiming support. Do not apply one fixed-APR/minimum-payment model to all products or build tax/benefit advice into this feature. [Simulation][T-debt]; [planner UI][T-debt-ui]; [our planning][F-planning]. |
| G14 | Planned one-off/quarterly/annual expenses and monthly set-aside calculations | Our subscriptions include quarterly/yearly recurrence and savings goals reserve money, but there is no dated planned-expense model with accrual and budget/forecast integration. | 9 | 8 | L | Prioritize dated reserves for annual/quarterly and one-off household costs. Use localized examples such as insurance, municipal bills and utilities adjustments; users choose amounts/dates. Distinguish reserve allocation from actual payments to prevent double counting. [Their irregular model][T-irregular]; [UI][T-irregular-ui]; [our planning][F-planning]. |
| G15 | Daily 30/60/90-day balance projection with dated income/bills/planned expenses, variable spending, lowest balance, first floor breach and shortfall | Our dashboard forecasts period totals from historical averages; Planning gives a 30-day safe-to-spend total. Neither is this dated balance curve. | 9 | 7 | L | Reuse recurring patterns, account balances and minimum-balance preference. Compute one shared daily series for chart, warnings and guidance, with clear stale-data handling. [Their orchestration][T-forecast]; [series][T-series]; [our `getBalanceForecast`][F-service]; [Planning][F-planning]. |
| G16 | Dated balance snapshots, historical net-worth chart and a 30-day change only when comparison data exists | Our net-worth feature shows current cash plus manual assets minus liabilities, without a stored history for those items. Transaction balance history alone is not historical net worth. | 8 | 8 | M | Snapshot accounts and manual wealth items with profile/date keys and source metadata. Distinguish missing history from a zero balance. [Their series][T-networth]; [balance actions][T-balances]; [our current summary][F-planning]. |
| G17 | General spending-anomaly inbox: merchant spikes, unusual category purchases, large first-time merchants and possible double charges | We already have subscription price-change, missed-payment and stale alerts, but not these broader purchase alerts. | 8 | 8 | M | Use local statistics with explanations and dismissals. Judge known counterparties using our IBAN/payment-provider mapping before declaring a new merchant; calibrate EUR thresholds against representative Dutch transaction histories. Existing bill-price alerts remain shared functionality. [Their detectors][T-alerts]; [alert UI][T-alert-ui]; [our subscription alerts][F-subscriptions]. |
| G18 | Guided weekly money review with inline queue, spending pace, upcoming bills, completion history, due reminders and streaks | We have a persisted monthly checklist with links to review areas. Missing the weekly guided flow and habit history/streaks. | 7 | 9 | M | Add a weekly cadence to the existing review model and embed actionable content; make streaks optional. No external push notification service was verified in their app. [Their review][T-weekly]; [our monthly review][F-planning-ui]. |
| G19 | Per-account “fresh / aging / stale / never imported” labels based on latest import or bank sync | We show import history and sync information, but no equivalent consolidated account freshness status in the financial review/dashboard. | 8 | 9 | S–M | Derive statement freshness per account and expose it beside balance/forecast outputs. Device-sync time must not masquerade as fresh bank data. [Their freshness][T-fresh]; [our dashboard][F-dashboard]; [import history][F-import]. |
| G20 | First-class cash, loan and investment account types, without mandatory IBANs | Our account types are checking/savings/credit; manual net-worth items partially cover extra assets/liabilities but do not provide full account behavior. | 7 | 6 | L | Separate bank-account identity from general financial accounts; propagate type semantics through transfers, cash forecasts, sync, import and net worth. [Their form][T-account]; [our account types][F-accounts]. |
| G21 | Split one bank transaction across multiple categories | **Explicitly retired locally:** migration 017 drops transaction splits; the older implementation should not be counted as an active feature. | 7 | 4 | L | Technically possible, but reintroducing a just-removed feature is a product-direction decision. Allocation totals must match the parent everywhere in budgets, analytics, exports, backup and sync. Keep out of the default recommendation list. [Their splits][T-splits]; [our removal][F-removed]. |

## B. Extensions of features we already have

These rows are not claims that Fluxby lacks budgets, goals, forecasting, merchant cleanup or analytics altogether.

| ID | Their additional behavior | Existing Fluxby foundation / precise gap | Value | Fit | Size | Integration approach and evidence |
|---|---|---|---:|---:|---|---|
| G22 | Inferred/configurable payday, including weekly, biweekly, twice-monthly and monthly schedules; per-day spending guidance until payday and month end | We reserve obligations and goals against available balances over 30 days; no payday configuration or daily allowance. | 8 | 8 | M | Prioritize configurable monthly and four-week income timing, while retaining other schedules for users who need them. Four-week support is our proposed adaptation (NL03), not a verified competitor feature. Model multiple income sources and explicit one-offs; preserve our cash-based safety limit instead of replacing it with their budget-only allowance. [Payday][T-payday]; [formula][T-safe]; [UI][T-safe-ui]; [our formula][F-planning]. |
| G23 | Month-specific budget allocations with previous-month copy | Our budgets are recurring monthly/yearly amounts scaled over a selected range; changing the base amount is not editing an independent month envelope. | 8 | 6 | L | Add dated overrides while preserving recurring defaults and historical values; migrate rollover calculations carefully. [Their store][T-budget-store]; [our `getBudgets`][F-service]. |
| G24 | Expected income, allocated total, money left to assign and needs/wants/savings allocation strip | Our budgets track spending caps and progress, without this explicit income-allocation workflow. | 7 | 7 | M | Optional planning mode atop budgets; do not require every user to assign all income. [Their budget model][T-budget]; [our budgets][F-budget]. |
| G25 | Explicit fixed-versus-variable category classification used by budgets, analytics and forecast | We have parent/child categories, income/expense behavior and detected subscriptions, but no general category `isFixed` setting. | 8 | 8 | M | Prioritize household fixed-cost visibility with user-editable category metadata. Recurrence does not automatically mean essential or fixed; keep these concepts separate. Use the classification consistently in budgets and forecast. [Their category editor][T-categories]; [our category types][F-categories]. |
| G26 | Budget suggestions combine monthly history, fixed bills, irregular reserves and goal requirements | We already suggest budgets from history, but the current service uses average transaction amount per category rather than this combined month-level model. | 8 | 8 | M | Extend existing smart proposals with true monthly totals and explain the suggestion's basis. G14/G25/G28 strengthen it but can follow an initial monthly-average improvement. [Their setup logic][T-budget-setup]; [our `getBudgetSuggestions`][F-service]. |
| G27 | Rollover can carry overspending as negative balance and resets when a month has no allocation | We already carry unused budget forward, capped at zero; this is different rollover policy, not missing rollover. | 6 | 7 | M | Add an explicit carry-surplus/carry-both policy only if users want it. Requires G23-style history for exact parity; preserve current semantics during migration. [Their carry calculation][T-rollover]; [our `getBudgets`][F-service]. |
| G28 | Goal deadline automatically yields the required monthly saving amount | We store deadline, target, current progress and a user-entered monthly contribution, but do not compute “save this much per month to reach it.” | 8 | 10 | S | Pure calculation plus bilingual helper text; handle expired deadlines and completed goals explicitly. [Their math][T-goal-math]; [our goal UI][F-planning-ui]. |
| G29 | Goal progress derives from categorized transactions, and goals feed budget suggestions | Our goals use manually recorded contributions and reserve their chosen monthly contribution in safe-to-spend. | 7 | 7 | L | Offer transaction-linked contributions while retaining manual entries. Deduplicate transfers/manual contributions; avoid treating savings transfers as consumption. [Their goal store][T-goal]; [budget setup][T-budget-setup]; [our goal service][F-planning]. |
| G30 | Cash-flow waterfall: income → fixed costs → variable costs → savings → remainder | We have income/expense, balance and category charts, but no matching waterfall breakdown. | 6 | 9 | S–M | Add after category semantics are defined (G25). Reuse existing chart components and exclude internal transfers consistently. [Their chart][T-waterfall]; [our analytics][F-analytics]. |
| G31 | Explicit selectable 3/6/12 completed-month baselines plus same-day-of-month comparison for the current month | We offer date filters and multi-month/year charts, but no equivalent baseline selector and matching partial-month summary deltas found. | 7 | 9 | M | Add clear comparison controls and labels, clamp shorter months and distinguish missing months from actual zero spend. [Their insights model][T-insights]; [our analytics][F-analytics]. |
| G32 | Learned categorization rules remember money direction; reviewed rows are protected from automatic recategorization | Our rule shape is pattern/category/priority. We have rule creation and bulk categorization already, but no equivalent explicit direction and reviewed-state contract. | 8 | 8 | M | Add source/review metadata and direction, preserve deliberate user decisions, show a preview before applying. [Their rule engine][T-rule]; [review action][T-rule-action]; [our rule types][F-categories]. |
| G33 | Persistent pairing of the two sides of a transfer, with local minimum-date-distance matching when no IBAN is available | We detect known own-account IBANs and have AI-assisted candidate pairs, but no equivalent persisted pair graph/local assignment algorithm. | 7 | 7 | M–L | Keep our reliable IBAN matching; add local candidate pairing and explicit relationships. Equal amounts alone are not sufficient proof: prefer user confirmation for ambiguous matches. [Their matcher][T-transfer]; [pair persistence][T-transfer-store]; [our transfer methods][F-service]. |
| G35 | Dedicated read-only wall display with automatic refresh | No display-only financial screen found. A normal Fluxby dashboard still exposes the full app/navigation. | 4 | 7 | M | A local display mode fits React well; remote access and restricted data delivery are separate work (G36). [Their wall panel][T-wall]; [our dashboard][F-dashboard]. |
| G36 | Revocable display token, browser enrollment and summary-only wall API; documented Cloudflare household access | We have device pairing and a developer REST API, but no equivalent least-data display-token contract or household reverse-proxy deployment workflow. | 3 | 3 | L–XL | Defer. Improve existing profiles/peer sync first; a shared profile is not role-based household access. If a remote display is later requested, design a minimal read-only contract separately. Their Cloudflare login protects a server and is not in-app household membership. [Wall API][T-wall-api]; [household guide][T-household]; [our API][F-api]; [peer pairing][F-sync]. |
| G37 | Configurable per-account colors carried through account/transaction displays | Our account model exposes type and ordering but no user-selected color field. | 3 | 9 | S–M | Small customization addition; use accessible tokens and include metadata in backup/sync. [Their account form][T-account]; [our account model][F-accounts]. |
| G38 | Explicit “mark as bill” on an individual transaction, choosing its cadence before enough repeats exist | We can detect, confirm and edit recurring patterns, but no equivalent direct create-from-one-transaction action was found. | 8 | 9 | M | Add a transaction action using the existing subscription editor and a persisted manual-source flag, so later detection respects the user's decision. [Their form][T-manual-bill]; [our subscriptions][F-subscriptions]; [service methods][F-service]. |
| G39 | Category retirement/reference management and goal archiving: distinct archive state; category deletion can preview dependencies and move references to another category | We soft-delete categories/goals, but no equivalent explicit archive state or full dependency-move workflow was found. | 7 | 8 | M | Preserve history while hiding retired options; make category reassignment transactional and profile-scoped. Their category archive has restrictions, so this is not unrestricted archive of any in-use category. [Their category management][T-category-lifecycle]; [editor][T-categories]; [goal archive][T-goal]; [our deletion methods][F-service]; [goals][F-planning]. |

## C. Technical or product-policy differences worth knowing

These are not all recommendations and are separated from the missing user-facing features above.

| ID | Difference | Value | Fit | Size | Assessment and evidence |
|---|---|---:|---:|---|---|
| D01 | Integer cents stored and used consistently, with APR stored in basis points | 8 | 4 | L | Strong accounting foundation. Fluxby currently stores major-unit REAL amounts, although Planning converts through cents for calculations. A full migration touches schema, imports, API, backups, sync and every calculation; do not mix units. This observation alone does not prove an existing rounding defect. [Their money helpers][T-money]; [schema][T-schema]; [our schema][F-schema]; [Planning math][F-planning]. |
| D02 | Rule engine supports regex, merchant/raw-description field choice, amount bounds and account filters | 7 | 7 | M | Verified as library/schema capability. I did **not** find a general user-facing editor exposing all these controls, so it must not be advertised as their complete shipped rule-builder UI. Fluxby's current pattern/category rules could grow these capabilities. [Their engine][T-rule]; [our rule types][F-categories]. |
| D03 | Budget/Goals gated until two completed months each contain at least 20 non-transfer rows | 2 | 9 | S | Implemented, but I would not copy the hard lock: it prevents intentional manual budgeting/goals for new users. Borrow a “limited history” notice and disable only unsupported automatic suggestions. [Their gate][T-gate]; [our Planning][F-planning-ui]. |
| D04 | Single-file SQLite deployment and file-copy backup workflow | 5 | 3 | L | Convenient for self-hosting and external backup tools. Fluxby's browser OPFS design deliberately has different operational needs, and our desktop app already offers local persistence. Improve portable export/recovery instead of moving the web app to a required server. [Their deployment][T-readme]; [our database bootstrap][F-db]; [backup UI][F-backup]. |

## D. What Fluxby has over them

“Not found there” is scoped to their pinned source, not a claim about possible future releases. These are capability differences, not measured performance or security certifications.

For Dutch positioning, lead with Dutch/English language support, verified Dutch bank imports, IBAN/contact and payment-processor handling, local control, and useful subscription views. Keep bank coverage claims limited to verified formats. Rabobank itself notes that statement names may identify a payment processor rather than the merchant, supporting the relevance of our existing resolution tools. [Rabobank consumer guide][NL-rabo].

| Fluxby advantage | What the other app has instead | Evidence |
|---|---|---|
| **Browser-only local operation with OPFS/WASM and static hosting** | Their UI requires a local Node/Next.js process and SQLite file. Both are local-first; serverless browser operation is our additional capability. | [Our database bootstrap][F-db], [their architecture][T-architecture]. |
| **Installable PWA with service-worker caching** | Their app-window launcher starts the local server and opens a browser window; no equivalent PWA/service-worker implementation found. | [Our service worker][F-sw], [registration][F-main], [their running instructions][T-readme]. |
| **Native Tauri desktop packaging and in-app update settings** | They launch a chromeless Chrome/Edge/Chromium window, requiring Node. | [Our Tauri config][F-tauri], [update settings][F-settings], [their launcher description][T-readme]. |
| **Peer-to-peer device pairing and encrypted sync between local data stores** | Their household setup gives devices access to one running server. No equivalent peer data replication/conflict-resolution system found. | [Our peer implementation][F-sync], [transport encryption][F-sync-crypto], [their household guide][T-household]. |
| **Separate local financial profiles with profile-scoped data, demo profile and profile controls** | Their app is single-user/single-ledger; “bank profiles” mean CSV mappings, not separate financial identities. | [Our profile context][F-profiles], [profile service][F-service], [their architecture][T-architecture]. |
| **Dutch and English translation infrastructure and language-specific demo content** | Their reviewed UI does not provide the Dutch translation and locale experience needed by our target users. | [Our Dutch][F-nl], [English][F-en], [demo service][F-service], [their formatter][T-money]. |
| **Dutch bank/IBAN workflows, active ING and ASN support** | No equivalent verified ING/ASN presets were found in their app. Generic mapping exists on both sides. | [Our import][F-import], [their bank profiles][T-profiles]. |
| **Built-in password protection and lock/unlock flow** | Their full app has no in-app login; remote protection relies on Cloudflare Access. Their wall token protects only display access. This is a UI-access advantage; no claim here that all Fluxby database bytes are encrypted at rest. | [Our lock context][F-lock], [their security description][T-readme]. |
| **Password-encrypted portable backup exports, validation/checksum preview and an in-app restore workflow with recovery snapshot** | They download/copy SQLite snapshots and document external restoration. Automatic pre-import backups are their separate advantage (G08). | [Our backup crypto][F-backup-crypto], [restore implementation][F-backup-data], [UI][F-backup], [their backup function][T-backup]. |
| **Address book with contact notes, multiple IBANs, merge/split identity tools and contact transaction history** | They have merchant names/aliases, but no comparable IBAN-centered contact domain found. Contact splitting is distinct from the retired transaction-amount splitting. | [Our address book][F-addressbook], [contact model][F-accounts], [their schema][T-schema]. |
| **Shared-IBAN/payment-processor resolution** | Their alias cleanup does not model several merchants behind a payment processor's shared bank account. | [Our processor settings][F-providers], [shared-IBAN model][F-accounts], [resolution methods][F-service]. |
| **Optional TypeSafe/Jev assistance for ambiguous import mappings, categorization/rule discovery, payment providers and recurring-source review** | Their detection is local deterministic logic; no equivalent AI integration found. Our AI is optional and network-dependent, not a claim that every judgment is better. | [Our typed AI client][F-ai], [service integration][F-service], [subscription review][F-subscriptions]. |
| **Subscription calendar plus detailed price history and explicit price-change/missed/stale alert controls** | They have bills, upcoming dates, dismissal, forecast events and price-jump anomalies, but no equivalent calendar/history/accept-new-price workflow found. | [Our subscriptions][F-subscriptions], [analytics history][F-analytics], [their anomaly detector][T-alerts]. |
| **Named saved transaction views and richer integrated transaction actions** | Their filters are URL-based and they have category editing/review. No saved-view store or equivalent full manual transaction create/edit/notes workflow found. | [Our saved views][F-views], [transactions][F-transactions], [their transaction actions][T-transactions]. |
| **Global Spotlight search/navigation** | Their review keyboard shortcuts serve the review screen, not app-wide search. | [Our Spotlight][F-spotlight], [their review screen][T-review]. |
| **Explicit light/dark theme settings** | Their design and reviewed UI are light-focused; a generated CSS `dark` variant alone is not an operational theme switch. | [Our appearance settings][F-settings], [their architecture/UI inventory][T-architecture]. |
| **Guided onboarding, localized demo experience and integrated bilingual Help Center** | Their README and operating guides cover setup, but no equivalent interactive onboarding tour and end-user help site found. | [Our onboarding][F-onboarding], [help routes][F-landing], [their docs][T-readme]. |
| **Broader optional developer REST surface with API documentation and Bruno collection** | Their server actions and small export/wall route surface are intended for their app, not a comparable documented REST integration product. Fluxby's developer API is separate from the browser's live OPFS database. | [Our API][F-api], [Bruno][F-bruno], [docs routes][F-landing], [their architecture][T-architecture]. |
| **Dedicated browser end-to-end coverage in addition to unit/service tests** | Their architecture guide explicitly says tests cover logic and there are no UI tests. Existing coverage is an engineering asset, not proof that today's dirty checkout passes. | [Our browser tests][F-tests], [their testing description][T-architecture]. |

## E. Shared capabilities — do not count these as new features

Both source trees already implement basic transaction browsing/search/filtering, multiple financial accounts, CSV import with preview and duplicate handling, hierarchical categories, learned/manual categorization rules, merchant-name cleanup, own-account transfer handling, recurring bills/income, budgets, budget suggestions, rollover, savings goals, some form of net worth, some form of forecasting/safe-to-spend, review workflows, charts, synthetic seed/demo data and backups.

The differences above are in breadth or implementation. In particular:

- **Budget rollover, goals, net worth, reviews and safe-to-spend are already present in Fluxby.** Adding these from scratch would duplicate existing work. [Planning][F-planning-ui], [budgets][F-budget].
- **Subscription price-change alerts already exist.** G17 is about broader transaction anomalies. [Subscriptions][F-subscriptions].
- **Transfer detection and category suggestions already exist.** G32/G33 concern direction/review provenance and persistent/local transfer pairing. [Data service][F-service].
- **CSV mapping and import preview already exist.** G03/G04 add persistence and richer controls. [Import][F-import].
- **Both apps keep data locally.** Optional connected features and Fluxby's AI/device sync should not be confused with “no network calls under every configuration.” [Their README][T-readme], [our AI client][F-ai], [peer sync][F-sync].

## F. How the additions should integrate into Fluxby

1. **Keep the existing platform.** Use React components, TanStack Query and our asynchronous data service. Port pure calculations selectively; rewrite their `getDb()`/Drizzle/server-action orchestration for SQLite WASM workers. Do not introduce Next.js as a feature dependency.
2. **Extend existing feature areas.** Import profiles belong in Import; reviews/refunds/duplicates in Transactions or a review mode; debt, reserves and history in Planning; daily cash forecasting can serve both Dashboard and Planning. Avoid creating a new top-level screen for every row in this report.
3. **Use existing safety and persistence contracts.** New records need profile ownership, UUIDs, timestamps, deletion semantics and transactional bulk writes. Register new tables in migrations, sync/backup/reset/demo flows; migrations should not resurrect removed transaction tools accidentally. [Sync table coverage][F-sync-tables], [backup coverage][F-backup-data].
4. **Unify derived financial calculations.** One source of truth should feed budgets, refunds, goal contributions, reserves and forecasts. Explicitly handle transfers, pending rows, stale accounts and refunds so totals remain consistent across pages.
5. **Keep every new flow bilingual and demonstrable.** Add EN/NL strings, language-aware seed data, onboarding anchors, help content and focused regression tests. Run the repository's required lint/type/test checks when implementation work begins. This report itself makes no implementation or test-pass claim.
6. **Separate Dutch bank-feed research from local feature delivery.** Evaluate NL06 against specific Dutch institutions, consent/reauthorization behavior, available account data, total cost and deployment constraints. No provider is selected by this plan.

## G. Dutch adaptations — proposals, not competitor capabilities

These additions translate the comparison into our market. They are **not** claims that the competitor has these features or that every component is absent from Fluxby. Reuse and extend our existing IBAN, import, contact, subscription and planning foundations.

| ID | Proposed scope | Value | Fit | Size | Delivery boundary |
|---|---|---:|---:|---|---|
| NL01 | Dutch consumer-bank coverage and reusable locale-aware imports | 10 | 8 | M–L | First validate Rabobank and ABN AMRO consumer exports alongside regression fixtures for ING/ASN. Other banks follow actual demand. Track bank, personal/business product, export format/version, language and verified sample; do not simply enable unfinished preset buttons. [Rabobank CSV evidence][NL-rabo]; [ABN business formats, not consumer verification][NL-abn]. |
| NL02 | Structured statement adapters: CAMT.053 first, MT940 when demonstrated demand requires it | 7 | 7 | L | Build shared normalized rows, preserve supplied references/currency/counterparties and handle batch details without duplicating parent totals. Format availability varies by bank/product. Start only after sample exports show benefit over existing CSV/TXT routes. [Rabobank business formats][NL-rabo-formats]; [ABN business formats][NL-abn]. |
| NL03 | Multiple income schedules, especially monthly and every four weeks, plus explicit one-off income | 8 | 8 | M | Extend G22/G15. Use a 28-day schedule for four-week income, not a calendar-month shortcut. Support editable salary/allowance dates; avoid hardcoded assumptions about employers or public-payment dates. This is scenario planning, not entitlement calculation. |
| NL04 | Reimbursements and shared-expense settlement, including recognizable Tikkie/payment-request flows | 9 | 8 | M–L | Extend G10/G12 with explicit user-confirmed links to an original expense and support partial/multiple repayments. Use existing contact/provider identity; never infer the financial meaning from a payment-brand name alone. No live Tikkie API integration or amount-splitting feature is implied. |
| NL05 | Better use of available SEPA/counterparty metadata and direct-debit identity | 8 | 8 | M | Extend our existing IBAN/provider handling to preserve supplied mandate, creditor and payment references where formats provide them. Use them as optional matching evidence for recurring payments and reversals; absence must remain supported. Track posted refunds/reversals, without initiating payments or direct-debit returns. |
| NL06 | Optional Dutch account-information/bank-feed feasibility study | 9 | 3 | XL for a production connector | Verify support for the exact Dutch banks and consumer account products we target. Assess consent/reauthorization, transaction history, account identifiers, cost and a protected credential architecture before selecting a provider. Deliver a sandbox proof; keep file imports independent and fully functional. |

### Phased roadmap and completion criteria

| Phase | Scope | Completion criteria |
|---|---|---|
| 1 — trustworthy Dutch imports | NL01, G03/G04/G05/G08; deliver G09/G19 as small parallel product increments | Verified consumer-bank fixtures; correct debit/credit/date/decimal handling; preview agrees with imported values; importing overlapping statements does not create duplicates; failed imports preserve data; batch recovery restores consistent balances. NL/EN help explains each verified bank export path. |
| 2 — actionable household planning | G10/G12/G14/G25/G26/G38, NL04/NL05; add G28 | Review decisions distinguish income/refund/reimbursement/transfer; manual recurring bills work before detection history exists; reserves are not counted as payments; monthly suggestions use monthly totals; partial repayments and goal guidance remain consistent across views. |
| 3 — useful cash forecast and trends | G15/G22/G16/G17 plus NL03 | One daily series drives forecast and minimum-balance warnings; test multiple income dates, 28-day schedules, month ends, Europe/Amsterdam date/DST boundaries and one-offs; expose stale inputs and uncertain predictions. Snapshot history distinguishes missing data from zero. |
| 4 — additional Dutch formats and budgeting depth | NL02, optional G23/G24/G29 | Add Dutch bank/product formats backed by demand and fixtures. Decide monthly-envelope budget semantics separately; avoid scope creep into tax returns, payroll or full business accounting. |
| Separate research track | NL06 | Produce a coverage/cost/consent/architecture assessment and a sandbox proof before committing to production integration. Verify Dutch-bank coverage; no provider selected by this report. |
| Deferred | G13/G35/G36 | Revisit only with target-user evidence; debt remains optional and product-specific. G21 stays excluded unless transaction splits are explicitly reconsidered. |

For every phase, implementation must include bilingual strings/help/demo content, profile isolation, backup/sync compatibility and the repository's required validation. These are proposed acceptance criteria; this report does not claim they have been implemented or tested.

### Dutch-market evidence

- Rabobank's consumer guide confirms CSV export and explains payment-provider names on statements. This supports prioritizing consumer CSV and our existing merchant-resolution strengths. [Consumer guide][NL-rabo].
- ABN AMRO and Rabobank publish business structured-file options. These justify investigating CAMT.053/MT940, but do not establish consumer availability at every bank. [ABN AMRO][NL-abn]; [Rabobank][NL-rabo-formats].


## Evidence index and limitations

Every `T-...` link below points to the exact competitor commit inspected; every `F-...` link points to the local Fluxby file from the source review; `NL-...` links are official Dutch bank sources consulted for this plan. The market revision updates recommendations and does not repeat the full source audit. Local references can change as ongoing work continues. Source availability establishes an implementation lead, not UX quality, performance, financial correctness or test status. Future changes should recheck the affected files before turning a recommendation into a plan.

This report is intentionally saved under the repository's ignored `.nexus/tmp/` directory. It is a review artifact, not a production change or a committed roadmap.

[F-accounts]: </Users/houkebv/Apps/fluxby/packages/shared/src/types/account.ts>
[F-addressbook]: </Users/houkebv/Apps/fluxby/apps/web/src/pages/AddressBook.tsx>
[F-ai]: </Users/houkebv/Apps/fluxby/apps/web/src/lib/typesafe-client.ts>
[F-analytics]: </Users/houkebv/Apps/fluxby/apps/web/src/pages/Analytics.tsx>
[F-api]: </Users/houkebv/Apps/fluxby/apps/api/src/app.ts>
[F-backup]: </Users/houkebv/Apps/fluxby/apps/web/src/components/settings/DataManagementSettings.tsx>
[F-backup-crypto]: </Users/houkebv/Apps/fluxby/apps/web/src/lib/backup-crypto.ts>
[F-backup-data]: </Users/houkebv/Apps/fluxby/apps/web/src/lib/data/backup.ts>
[F-bruno]: </Users/houkebv/Apps/fluxby/apps/api/bruno/README.md>
[F-budget]: </Users/houkebv/Apps/fluxby/apps/web/src/pages/Budgets.tsx>
[F-categories]: </Users/houkebv/Apps/fluxby/packages/shared/src/types/category.ts>
[F-dashboard]: </Users/houkebv/Apps/fluxby/apps/web/src/pages/Dashboard.tsx>
[F-db]: </Users/houkebv/Apps/fluxby/apps/web/src/lib/db-singleton.ts>
[F-en]: </Users/houkebv/Apps/fluxby/apps/web/src/lib/i18n/en.ts>
[F-import]: </Users/houkebv/Apps/fluxby/apps/web/src/pages/Import.tsx>
[F-landing]: </Users/houkebv/Apps/fluxby/apps/landing/src/App.tsx>
[F-lock]: </Users/houkebv/Apps/fluxby/apps/web/src/contexts/EncryptionContext.tsx>
[F-main]: </Users/houkebv/Apps/fluxby/apps/web/src/main.tsx>
[F-nl]: </Users/houkebv/Apps/fluxby/apps/web/src/lib/i18n/nl.ts>
[F-onboarding]: </Users/houkebv/Apps/fluxby/apps/web/src/components/onboarding/OnboardingContext.tsx>
[F-planning]: </Users/houkebv/Apps/fluxby/apps/web/src/lib/data/financial-planning.ts>
[F-planning-ui]: </Users/houkebv/Apps/fluxby/apps/web/src/pages/Planning.tsx>
[F-profiles]: </Users/houkebv/Apps/fluxby/apps/web/src/contexts/ProfileContext.tsx>
[F-providers]: </Users/houkebv/Apps/fluxby/apps/web/src/components/settings/PaymentProcessorSettings.tsx>
[F-removed]: </Users/houkebv/Apps/fluxby/packages/database/src/migrations/017_remove_transaction_tools.ts>
[F-schema]: </Users/houkebv/Apps/fluxby/packages/database/src/schema.ts>
[F-service]: </Users/houkebv/Apps/fluxby/apps/web/src/lib/data-service.ts>
[F-settings]: </Users/houkebv/Apps/fluxby/apps/web/src/components/settings/AppSettings.tsx>
[F-spotlight]: </Users/houkebv/Apps/fluxby/apps/web/src/components/spotlight/SpotlightDialog.tsx>
[F-subscriptions]: </Users/houkebv/Apps/fluxby/apps/web/src/pages/Subscriptions.tsx>
[F-sw]: </Users/houkebv/Apps/fluxby/apps/web/public/sw.js>
[F-sync]: </Users/houkebv/Apps/fluxby/packages/core/src/peer.ts>
[F-sync-crypto]: </Users/houkebv/Apps/fluxby/packages/core/src/sync-encryption.ts>
[F-sync-tables]: </Users/houkebv/Apps/fluxby/apps/web/src/lib/data-sync.ts>
[F-tauri]: </Users/houkebv/Apps/fluxby/apps/tauri/tauri.conf.json>
[F-tests]: </Users/houkebv/Apps/fluxby/e2e/app-review.spec.ts>
[F-transactions]: </Users/houkebv/Apps/fluxby/apps/web/src/pages/Transactions.tsx>
[F-views]: </Users/houkebv/Apps/fluxby/apps/web/src/lib/data/saved-transaction-views.ts>
[T-account]: <https://github.com/gillespiejameson/personal-finance-tracker/blob/a3cc0258076f3e4ddbc9b7b820d09fcd7285a09a/src/components/finance/AccountForm.tsx>
[T-alert-ui]: <https://github.com/gillespiejameson/personal-finance-tracker/blob/a3cc0258076f3e4ddbc9b7b820d09fcd7285a09a/src/components/finance/alerts/AlertList.tsx>
[T-alerts]: <https://github.com/gillespiejameson/personal-finance-tracker/blob/a3cc0258076f3e4ddbc9b7b820d09fcd7285a09a/src/lib/anomalies/detect.ts>
[T-architecture]: <https://github.com/gillespiejameson/personal-finance-tracker/blob/a3cc0258076f3e4ddbc9b7b820d09fcd7285a09a/docs/ARCHITECTURE.md>
[T-backup]: <https://github.com/gillespiejameson/personal-finance-tracker/blob/a3cc0258076f3e4ddbc9b7b820d09fcd7285a09a/src/lib/db/backup.ts>
[T-balances]: <https://github.com/gillespiejameson/personal-finance-tracker/blob/a3cc0258076f3e4ddbc9b7b820d09fcd7285a09a/src/actions/networth.ts>
[T-budget]: <https://github.com/gillespiejameson/personal-finance-tracker/blob/a3cc0258076f3e4ddbc9b7b820d09fcd7285a09a/src/lib/budget/page.ts>
[T-budget-setup]: <https://github.com/gillespiejameson/personal-finance-tracker/blob/a3cc0258076f3e4ddbc9b7b820d09fcd7285a09a/src/lib/budget/setup.ts>
[T-budget-store]: <https://github.com/gillespiejameson/personal-finance-tracker/blob/a3cc0258076f3e4ddbc9b7b820d09fcd7285a09a/src/lib/budget/store.ts>
[T-categories]: <https://github.com/gillespiejameson/personal-finance-tracker/blob/a3cc0258076f3e4ddbc9b7b820d09fcd7285a09a/src/components/finance/CategoryManager.tsx>
[T-category-lifecycle]: <https://github.com/gillespiejameson/personal-finance-tracker/blob/a3cc0258076f3e4ddbc9b7b820d09fcd7285a09a/src/lib/categories/manage.ts>
[T-debt]: <https://github.com/gillespiejameson/personal-finance-tracker/blob/a3cc0258076f3e4ddbc9b7b820d09fcd7285a09a/src/lib/debt/simulate.ts>
[T-debt-ui]: <https://github.com/gillespiejameson/personal-finance-tracker/blob/a3cc0258076f3e4ddbc9b7b820d09fcd7285a09a/src/components/finance/debt/DebtPlanner.tsx>
[T-dedupe]: <https://github.com/gillespiejameson/personal-finance-tracker/blob/a3cc0258076f3e4ddbc9b7b820d09fcd7285a09a/src/lib/import/dedupe.ts>
[T-export]: <https://github.com/gillespiejameson/personal-finance-tracker/blob/a3cc0258076f3e4ddbc9b7b820d09fcd7285a09a/src/lib/export/transactions.ts>
[T-forecast]: <https://github.com/gillespiejameson/personal-finance-tracker/blob/a3cc0258076f3e4ddbc9b7b820d09fcd7285a09a/src/actions/forecast.ts>
[T-fresh]: <https://github.com/gillespiejameson/personal-finance-tracker/blob/a3cc0258076f3e4ddbc9b7b820d09fcd7285a09a/src/lib/ritual/store.ts>
[T-gate]: <https://github.com/gillespiejameson/personal-finance-tracker/blob/a3cc0258076f3e4ddbc9b7b820d09fcd7285a09a/src/lib/budget/gate.ts>
[T-goal]: <https://github.com/gillespiejameson/personal-finance-tracker/blob/a3cc0258076f3e4ddbc9b7b820d09fcd7285a09a/src/lib/goals/store.ts>
[T-goal-math]: <https://github.com/gillespiejameson/personal-finance-tracker/blob/a3cc0258076f3e4ddbc9b7b820d09fcd7285a09a/src/lib/goals/math.ts>
[T-household]: <https://github.com/gillespiejameson/personal-finance-tracker/blob/a3cc0258076f3e4ddbc9b7b820d09fcd7285a09a/docs/HOUSEHOLD.md>
[T-import]: <https://github.com/gillespiejameson/personal-finance-tracker/blob/a3cc0258076f3e4ddbc9b7b820d09fcd7285a09a/src/lib/import/commitFlow.ts>
[T-insights]: <https://github.com/gillespiejameson/personal-finance-tracker/blob/a3cc0258076f3e4ddbc9b7b820d09fcd7285a09a/src/lib/insights/page.ts>
[T-irregular]: <https://github.com/gillespiejameson/personal-finance-tracker/blob/a3cc0258076f3e4ddbc9b7b820d09fcd7285a09a/src/lib/spreading/items.ts>
[T-irregular-ui]: <https://github.com/gillespiejameson/personal-finance-tracker/blob/a3cc0258076f3e4ddbc9b7b820d09fcd7285a09a/src/components/finance/spreading/IrregularExpenses.tsx>
[T-manual-bill]: <https://github.com/gillespiejameson/personal-finance-tracker/blob/a3cc0258076f3e4ddbc9b7b820d09fcd7285a09a/src/components/finance/MarkAsBillForm.tsx>
[T-mapping]: <https://github.com/gillespiejameson/personal-finance-tracker/blob/a3cc0258076f3e4ddbc9b7b820d09fcd7285a09a/src/components/finance/MappingWizard.tsx>
[T-money]: <https://github.com/gillespiejameson/personal-finance-tracker/blob/a3cc0258076f3e4ddbc9b7b820d09fcd7285a09a/src/lib/money.ts>
[T-networth]: <https://github.com/gillespiejameson/personal-finance-tracker/blob/a3cc0258076f3e4ddbc9b7b820d09fcd7285a09a/src/lib/networth/series.ts>
[T-payday]: <https://github.com/gillespiejameson/personal-finance-tracker/blob/a3cc0258076f3e4ddbc9b7b820d09fcd7285a09a/src/lib/budget/payday.ts>
[T-profiles]: <https://github.com/gillespiejameson/personal-finance-tracker/blob/a3cc0258076f3e4ddbc9b7b820d09fcd7285a09a/src/lib/import/profiles.ts>
[T-queue]: <https://github.com/gillespiejameson/personal-finance-tracker/blob/a3cc0258076f3e4ddbc9b7b820d09fcd7285a09a/src/lib/review/queue.ts>
[T-readme]: <https://github.com/gillespiejameson/personal-finance-tracker/blob/a3cc0258076f3e4ddbc9b7b820d09fcd7285a09a/README.md>
[T-refund]: <https://github.com/gillespiejameson/personal-finance-tracker/blob/a3cc0258076f3e4ddbc9b7b820d09fcd7285a09a/src/lib/refunds/match.ts>
[T-review]: <https://github.com/gillespiejameson/personal-finance-tracker/blob/a3cc0258076f3e4ddbc9b7b820d09fcd7285a09a/src/components/finance/ReviewScreen.tsx>
[T-rollover]: <https://github.com/gillespiejameson/personal-finance-tracker/blob/a3cc0258076f3e4ddbc9b7b820d09fcd7285a09a/src/lib/budget/rollover.ts>
[T-rule]: <https://github.com/gillespiejameson/personal-finance-tracker/blob/a3cc0258076f3e4ddbc9b7b820d09fcd7285a09a/src/lib/rules/engine.ts>
[T-rule-action]: <https://github.com/gillespiejameson/personal-finance-tracker/blob/a3cc0258076f3e4ddbc9b7b820d09fcd7285a09a/src/actions/review.ts>
[T-safe]: <https://github.com/gillespiejameson/personal-finance-tracker/blob/a3cc0258076f3e4ddbc9b7b820d09fcd7285a09a/src/lib/budget/safeToSpend.ts>
[T-safe-ui]: <https://github.com/gillespiejameson/personal-finance-tracker/blob/a3cc0258076f3e4ddbc9b7b820d09fcd7285a09a/src/components/finance/budget/SafeToSpendCard.tsx>
[T-schema]: <https://github.com/gillespiejameson/personal-finance-tracker/blob/a3cc0258076f3e4ddbc9b7b820d09fcd7285a09a/src/lib/db/schema.ts>
[T-series]: <https://github.com/gillespiejameson/personal-finance-tracker/blob/a3cc0258076f3e4ddbc9b7b820d09fcd7285a09a/src/lib/forecast/series.ts>
[T-splits]: <https://github.com/gillespiejameson/personal-finance-tracker/blob/a3cc0258076f3e4ddbc9b7b820d09fcd7285a09a/src/lib/review/splits.ts>
[T-sync]: <https://github.com/gillespiejameson/personal-finance-tracker/blob/a3cc0258076f3e4ddbc9b7b820d09fcd7285a09a/src/lib/simplefin/sync.ts>
[T-transactions]: <https://github.com/gillespiejameson/personal-finance-tracker/blob/a3cc0258076f3e4ddbc9b7b820d09fcd7285a09a/src/actions/transactions.ts>
[T-transfer]: <https://github.com/gillespiejameson/personal-finance-tracker/blob/a3cc0258076f3e4ddbc9b7b820d09fcd7285a09a/src/lib/transfers/detect.ts>
[T-transfer-store]: <https://github.com/gillespiejameson/personal-finance-tracker/blob/a3cc0258076f3e4ddbc9b7b820d09fcd7285a09a/src/lib/transfers/apply.ts>
[T-undo]: <https://github.com/gillespiejameson/personal-finance-tracker/blob/a3cc0258076f3e4ddbc9b7b820d09fcd7285a09a/src/actions/imports.ts>
[T-wall]: <https://github.com/gillespiejameson/personal-finance-tracker/blob/a3cc0258076f3e4ddbc9b7b820d09fcd7285a09a/src/components/finance/wall/WallPanel.tsx>
[T-wall-api]: <https://github.com/gillespiejameson/personal-finance-tracker/blob/a3cc0258076f3e4ddbc9b7b820d09fcd7285a09a/src/app/api/wall/route.ts>
[T-waterfall]: <https://github.com/gillespiejameson/personal-finance-tracker/blob/a3cc0258076f3e4ddbc9b7b820d09fcd7285a09a/src/components/finance/charts/CashFlowWaterfall.tsx>
[T-weekly]: <https://github.com/gillespiejameson/personal-finance-tracker/blob/a3cc0258076f3e4ddbc9b7b820d09fcd7285a09a/src/components/finance/ritual/WeeklyReview.tsx>

[NL-rabo]: <https://www.rabobank.nl/particulieren/service/financiele-overzichten/overzicht-betaalrekening-ontvangen>
[NL-abn]: <https://www.abnamro.nl/nl/zakelijk/internet-bankieren/bestanden-downloaden.html>
[NL-rabo-formats]: <https://www.rabobank.nl/bedrijven/service/online-bankieren/informatie-over-bestandsformaten>
