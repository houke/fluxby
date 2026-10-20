# Branch integration review, 11 October 2026

Branch: `codex/app-review-improvements`. Starting tip: `6c5906b`. Integrated main: `54e51cf182d6f2c90617976468b6a5ccdb8129cc`. The existing 13 local commits are retained. This delivery is local; no push, pull request, release or deployment is included.

## Review scope

The review follows the branch's delivery checklist and focuses on financial calculations, profile isolation, stored-feature lifecycle, transaction review, bilingual documentation and rendered workflows. It combines domain source review, real SQLite regressions and browser acceptance. Earlier review results are historical context, not validation of this merge. Deferred provider integrations and competitor-parity extensions are not enabled without the required bank data, credentials or attribution design.

## Confirmed gaps fixed

- The dependency merge retains the patched npm security audit resolutions and native dependency updates from main. The browser fixture combines main's state-based setup/tour waits with this branch's encrypted unlock handling.
- Profile deletion now retires every owned feature table discovered from the schema, including planning, savings, import and review records. Legacy NULL-owned transactions inherit account ownership; explicit foreign ownership takes precedence. Shared records and other profiles are preserved.
- The compatibility `resetAllData()` method clears all profile-domain tables and recreates its Demo profile in one scoped transaction. Restrictive newer foreign keys no longer cause a partial reset, and failed recreation rolls back the original data. Clearing transactions also respects explicit profile ownership.
- The optional API's demo reseed now replaces all profile data in one transaction. A failed household-feature insert preserves the previous records. Real deletion/reset tests verify the newer feature tables' foreign-key cascades.
- Goal budget commitments now use actual manual and linked funding and stop at the remaining target. Completed goals contribute zero. Expired one-off plans no longer suppress recurring-bill guidance.
- Goal, net-worth and preference mutations capture profile ownership and roll back if it changes during asynchronous work. Advanced category rules read and apply on the same scoped transaction, reject profile changes, and preserve rule provenance. Monthly financial inputs reject unsafe cent precision.
- Linking a savings transaction offers an explicit replacement of an equal-value existing manual contribution. The selector shows the recorded date; the service verifies the contribution ID, goal, profile, exact amount and recorded creation time before soft-deleting it atomically. The default preserves manual contributions, and amount/source changes clear replacement selection. Funding caps across linked transactions and paired transfers remain enforced.
- Confirmed refunds/reimbursements offer an explicit action to use the original expense category when all linked expenses share a category. Existing manual/rule provenance and the prior category are restored by Undo; linking alone does not overwrite a deliberate category.
- Transfer suggestions assign each transaction once, prefer supplied own-account IBAN evidence, then choose the closest available date with deterministic tie breaking. This is greedy matching, not a globally optimal assignment.
- Anomaly explanations now show detector-specific reference counts, windows and baseline amounts. New-merchant alerts require ten prior expenses and a payment of at least EUR 100. Category-spike alerts select an expense rather than an unrelated income transaction. Merchant/contact/provider identity resolution and Dutch threshold calibration remain unverified extensions.
- Setup/unlock password visibility controls now have Dutch/English names, tooltips, keyboard support and pressed states. Inputs have explicit names. Positive amounts in the transaction deletion dialog use a contrast-compliant light-mode color.
- Normalized import previews and skipped-import history format full dates as `dd-mm-yyyy`, preserving ISO parser, storage and export values.
- Browser tests follow the current demo-first setup; removed setup choices are not reintroduced. History fixtures create explicit disposable personal profiles. The delivery report reflects the retirement of saved transaction views while retaining their legacy backup/sync lifecycle.
- Help and onboarding explain the new refund, evidence, matching and manual-contribution choices in Dutch and English.

## Validation

Final validation results are recorded here after the checks complete.

## Remaining boundaries

The broader roadmap still includes guided weekly-review history/reminders, category-attributed commitment suggestions and automatic category-derived goal funding. Transfer matching is deterministic nearest-available matching. Merchant identity resolution and representative Dutch-bank calibration require further evidence. Bank certification, CAMT/MT940 adapters and live bank feeds still require representative exports and/or provider credentials; no unverified adapters were added.

This review introduces no schema, sync, export or external API format changes. The branch's existing compatibility changes relative to released main remain documented in [the 7 October review](branch-review-2026-10-07.md#compatibility-and-upgrade-notes): remote API authentication, peer protocol/schema gates, scoped database callbacks, retired intermediate split tables and v3 exports with legacy v2 restoration. Native desktop packaging and physical multi-device WebRTC acceptance are not established by local browser/domain tests.
