# Onboarding and bilingual feature coverage

The guided tour now has 159 steps across 14 chapters, up from 129 steps. It retains the existing welcome acknowledgement, pause/resume, and full-completion storage flags. It uses the demo profile and does not make financial changes while explaining features.

## Coverage

| Area            | Explanations included                                                                                                                                                                                                                       |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Navigation      | Desktop sidebar, mobile navigation and More menu, filters, search shortcuts, privacy, appearance, profile selection, current-page help                                                                                                      |
| Dashboard       | Account balances and freshness, income/expenses/savings, charts, budgets, forecast, subscriptions and recent transactions                                                                                                                   |
| Transactions    | Filters, details, recurring badges, payment providers, categorization, contacts, manual entries, batch actions and five-minute deletion undo                                                                                                |
| Review          | Missing categories, possible duplicates, unusual amounts, snoozing and shortcuts, partial refunds/reimbursements, own-account transfers, recurring bills and filtered CSV export                                                            |
| Compact view    | Compact/comfortable rows below the transaction filters                                                                                                                                                                                      |
| Analytics       | Category trends and breakdowns, income/expenses, cash flow and comparable-month baselines                                                                                                                                                   |
| Budgets         | Recurring defaults versus month overrides, copying a month, expected income, allocation groups, historical suggestions, surplus versus deficit carry and resetting carry                                                                    |
| Planning        | Safe-to-spend reserves, goals and contributions, assets/debts, monthly checklist, dated household income/expenses, daily forecast, variable-spending estimates, net-worth snapshots, linked goal contributions/archiving and weekly reviews |
| Subscriptions   | Detection/confirmation, optional Jev matching, alerts, actions, calendar, frequencies, renewals and cancellation notice dates                                                                                                               |
| Address book    | Contacts, cleanup rules, shared/merged IBANs, optional Jev matching, searches and transaction history                                                                                                                                       |
| Categories      | Parent/child categories, fixed costs and allocation groups, archiving/reference review, keyword and advanced direction/amount/account rules                                                                                                 |
| Import          | Bank-file formats, mapping/import profiles, preserved source data, exact versus possible duplicates, history, protected undo, local checkpoints and freshness                                                                               |
| Settings        | Topic navigation and scope, profiles, account types/colors/balances, security, optional AI and WebMCP, sync, backups/health, profile cleanup, help and updates                                                                              |
| Help/completion | Feature overview, quick start, FAQs, external help and next steps                                                                                                                                                                           |

Every step has Dutch and English titles and explanation text. Added and expanded feature copy lives in `apps/web/src/lib/i18n/onboarding-guide.ts`, exposed through both app dictionaries. The Help Center explains compact rows and the shared transaction action row directly in the transaction article and uses the actual Household planning entry point for dated plans and linked savings contributions.

## Tour behavior

- A single provider owns navigation. Planning tab URLs and Settings topic URLs restore the intended destination when starting, moving backwards, resuming, or requesting current-page help.
- Spotlight selection prefers visible responsive controls. Conditional controls, such as mapping before a file upload or a merged contact that is absent, highlight their visible owning area while retaining their explanation.
- The address-book disclosure opens without toggling closed on a revisit. Delayed screen content refreshes the spotlight, and unavailable targets clear the previous highlight.
- The mobile navigation card stays within the viewport; chapter shortcuts scroll horizontally and previous/next controls remain visible. Long explanations can scroll inside the card.
- The dashboard's uncategorized category label uses the selected language, preserving names of real categories.

## Validation

- ESLint, workspace type checking, and the complete Vitest suite pass: 150 files / 1,823 tests.
- The transaction-action update passes six browser checks: shared-card layout and compact-density persistence on desktop and mobile, plus filtered CSV/review workflows and updated Help in Dutch and English.
- Before the transaction-action change, Chromium verified all 159 tour steps in NL and EN on desktop (1440×1000) and mobile (393×852), including exact rendered titles/content, destinations, visible controls or fallbacks, navigation bounds, explanations within the viewport above navigation, and completion persistence after reload/unlock.
- No unavailable effective tour targets in any of the four walkthroughs.
- Two Chromium checks verify the updated Help explanations in each language, and two existing workflow checks verify six Help articles on desktop and mobile in both languages.
- Mobile screenshots were inspected for the repayment and household-forecast explanations and tour navigation.

These checks verify explanation coverage, routing, localization, layout and tour lifecycle. They do not independently exercise every financial operation described in the tour or native desktop behavior. The saved-filter app methods and WebMCP tool are removed. Database schema, sync format, backup format and financial calculations are unchanged. Legacy saved-filter rows remain compatible with backups and sync, but are no longer seeded or exposed in the UI.
