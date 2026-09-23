# Jev app review and implementation plan

**Status:** proposed  
**Review date:** 2026-09-23

## Scope

Reviewed the existing TypeSafe integration guide, Jev client, transaction and import flows, address book, subscriptions, and transfer handling. This plan proposes the next Jev work; it does not enable new AI calls by itself.

## Current Jev coverage

Fluxby already uses Jev for:

1. Transaction category suggestions and category-rule discovery.
2. Ambiguous CSV date formats and unknown debit/credit direction values.
3. Payment-provider detection for shared IBANs.
4. Recurring merchant grouping when names differ for the same IBAN.
5. Semantic duplicate suggestions in a review dialog.

The user-provided API key remains opt-in, and existing deterministic behavior remains available without it. Current integration details are documented in [`TYPESAFE-INTEGRATION.md`](TYPESAFE-INTEGRATION.md).

## Review findings

| Area | Jev fit | Recommendation and limit |
| --- | --- | --- |
| Generic CSV column mapping | High. Import already has deterministic mappings and Jev-assisted date and direction interpretation, but unfamiliar headers still need a reliable mapping. | First candidate. When code cannot map a required field confidently, ask Jev to choose only among the actual CSV columns, with an explicit `unmapped` option. Show the chosen mapping and parsed preview for user approval before importing. |
| Address book identity suggestions | High. The address book already groups by IBAN, finds similar names, and supports linking and resolving shared IBANs. | Second candidate. Use a closed set of existing contacts plus `no match` to suggest which merchant variants may belong to a contact. Let the user confirm each link. Never merge contacts or move an IBAN automatically. |
| Unmatched internal transfer pairs | Medium. The current detector marks transactions whose counterparty IBAN exactly matches one of the user's own accounts. | Optional later candidate. Generate possible opposite amount pairs from nearby dates and the user's own accounts, then use Jev only to prioritize a review list. Keep marking or linking as a user action; do not replace exact IBAN matching. |
| Natural-language transaction search | Medium to low. It could interpret questions such as “show my train costs,” but transaction search and category/date filters already cover exact use cases. | Defer until users ask for it. It sends more transaction context, overlaps existing filters, and needs a clear review of privacy and expected behavior. |
| Budgets, balances, and forecasts | Low. These are numeric calculations over explicit inputs. | Keep deterministic. Jev adds little to arithmetic and forecast math. |

## Existing policy issue to resolve first

The current client uses `AUTO_CATEGORY_CONFIDENCE_THRESHOLD = 0.7`, and the settings and integration documentation also describe a 70% automatic category threshold. A previously recorded product decision asked for automatic categorization only above 90%. Reconcile this before expanding automatic writes: use a strict `> 0.9` gate for automatic assignment, and route lower-confidence suggestions to an explicit review flow.

## Proposed implementation sequence

### Phase 0: Set shared guardrails

- Align the category auto-assignment and rule-discovery gates with the approved confidence policy.
- Keep the user-supplied key requirement; never ship a shared provider key.
- Send only the fields needed for the judgment, and invoke Jev only when a user action or enabled workflow needs it.
- Preserve a deterministic/manual path for missing keys, low confidence, timeouts, and provider errors.
- Record representative synthetic or user-approved examples and measure precision and coverage before changing thresholds.

### Phase 1: Assisted CSV column mapping

- Reuse the generic import field list and its existing candidate columns.
- Call Jev only when a required mapping is missing or ambiguous. Ask one Choice question per field in a single request; each question can select an available header or `unmapped`.
- Include only the headers and the smallest sample needed to distinguish fields. Do not send full files.
- Validate every returned column name against the source headers, then rerun the existing parser and preview.
- Require the user to accept the mapping and preview before writing imported transactions.

### Phase 2: Address book match suggestions

- Keep exact IBAN, existing links, and deterministic cleanup rules first.
- Build bounded candidate sets only for names that remain unresolved; ask Jev to choose an existing contact or `no match`.
- Show the evidence and suggestion in the address book review UI. Apply a link only after user confirmation.
- Do not auto-merge contacts, overwrite names, or infer that two people sharing an IBAN are one contact.

### Phase 3: Optional transfer review queue

- Reuse deterministic amount, date, and account checks to produce plausible opposite-sign pairs that lack an exact own-account IBAN match.
- Ask one narrow same-transfer judgment for each pair and use its probability to order the review queue.
- Show amount, date, and account evidence. A user must confirm before Fluxby changes either transaction.
- Skip this phase if deterministic matching already handles the reported cases well.

## Acceptance criteria

- No configured key means no Jev request and no change to existing import or cleanup behavior.
- Every Choice workflow includes a no-match option and uses only candidates built by Fluxby code.
- All responses are schema-checked and candidate IDs or headers are validated before use.
- Ambiguous or low-confidence results go to manual review; no AI result deletes a transaction or silently merges contacts.
- User-facing text is translated in Dutch and English, and Help Center or integration docs describe any new user-visible workflow.
- Review a small labeled dataset for accuracy, confidence, coverage, latency, and request volume before release.

## TypeSafe references

- [Example use cases](https://docs.typesafe.ai/concepts/use-case-map) — classification, extraction, retrieval, and ranking patterns.
- [Choice](https://docs.typesafe.ai/primitives/choice) — closed-set selection and explicit `none` options.
- [Noul](https://docs.typesafe.ai/primitives/noul) — a single yes/no judgment for transfer-pair review.
- [Confidence](https://docs.typesafe.ai/confidence) — probability-derived confidence and thresholds scaled to action risk.
