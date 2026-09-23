# Jev app review and implementation plan

| Status                                | Review date |
| ------------------------------------- | ----------- |
| Implemented; model evaluation pending | 2026-09-23  |

## Scope

Reviewed the existing TypeSafe integration guide, Jev client, transaction and import flows, address book, subscriptions, and transfer handling. This review records the Jev additions implemented after the original audit.

## Current Jev coverage

Fluxby already uses Jev for:

1. Transaction category suggestions and category-rule discovery.
2. Ambiguous CSV date formats and unknown debit/credit direction values.
3. Payment-provider detection for shared IBANs.
4. Recurring merchant grouping when names differ for the same IBAN.
5. Semantic duplicate suggestions in a review dialog.
6. Missing or ambiguous CSV column mapping suggestions, shown in the existing
   mapping and preview flow.
7. Address book contact match suggestions, confirmed by the user one at a time.
8. Possible internal transfer pairs, reviewed and marked by the user.

The user-provided API key remains opt-in, and existing deterministic behavior remains available without it. Current integration details are documented in [`TYPESAFE-INTEGRATION.md`](TYPESAFE-INTEGRATION.md).

## Review findings

| Area                                | Jev fit                                                                                                                                                                                         | Recommendation and limit                                                                                                                                                                                 |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Generic CSV column mapping          | High. Deterministic mappings and Jev-assisted date and direction handling now cover familiar exports; missing or ambiguous required fields can use a closed choice over the file's own headers. | Implemented. Jev prefills only a validated field choice. The user reviews the mapping and parsed preview before importing.                                                                               |
| Address book identity suggestions   | High. Existing IBAN groups and link actions support a user-confirmed identity match.                                                                                                            | Implemented. Jev chooses among a short list of existing contacts plus `none`. IBANs remain local, and each link needs user confirmation.                                                                 |
| Unmatched internal transfer pairs   | Medium. The existing detector marks transactions whose counterparty IBAN exactly matches one of the user's own accounts.                                                                        | Implemented as an optional review action. Deterministic amount, sign, date, and account checks bound the candidates; Jev prioritizes them. The user confirms the pair before either transaction changes. |
| Natural-language transaction search | Medium to low. It could interpret questions such as “show my train costs,” but transaction search and category/date filters already cover exact use cases.                                      | Defer until users ask for it. It sends more transaction context, overlaps existing filters, and needs a clear review of privacy and expected behavior.                                                   |
| Budgets, balances, and forecasts    | Low. These are numeric calculations over explicit inputs.                                                                                                                                       | Keep deterministic. Jev adds little to arithmetic and forecast math.                                                                                                                                     |

## Confidence policy

The user requested a 60% automatic category threshold. The shared client constant is `AUTO_CATEGORY_CONFIDENCE_THRESHOLD = 0.6`; category assignments and generated category rules require confidence strictly above 0.6. Lower or invalid results are skipped. The previous 90% decision is superseded by the current request.

## Proposed implementation sequence

### Phase 0: Set shared guardrails — implemented

- Align the category auto-assignment and rule-discovery gates with the requested strict `> 0.6` threshold.
- Keep the user-supplied key requirement; never ship a shared provider key.
- Send only the fields needed for the judgment, and invoke Jev only when a user action or enabled workflow needs it.
- Preserve a deterministic/manual path for missing keys, low confidence, timeouts, and provider errors.
- Before making accuracy claims or expanding automatic actions, measure precision and coverage on representative synthetic or user-approved examples.

### Phase 1: Assisted CSV column mapping — implemented

- Reuse the generic import field list and its existing candidate columns.
- Call Jev only when a required mapping is missing or ambiguous. Ask one Choice question per field in a single request; each question can select an available header or `unmapped`.
- Include the headers and at most two short samples from date, amount, or description candidate columns. Do not send full files.
- Validate every returned header against the source headers, then use the existing parser and preview.
- Require the user to accept the mapping and preview before writing imported transactions.

### Phase 2: Address book match suggestions — implemented

- Keep exact IBAN, existing links, and deterministic cleanup rules first.
- Build bounded candidate sets only for names that remain unresolved; ask Jev to choose an existing contact or `none`.
- Show the evidence and suggestion in the address book review UI. Apply a link only after user confirmation.
- Do not auto-merge contacts, overwrite names, or infer that two people sharing an IBAN are one contact.

### Phase 3: Transfer review — implemented

- Reuse deterministic amount, date, and account checks to produce plausible opposite-sign pairs that lack an exact own-account IBAN match.
- Ask one narrow same-transfer judgment for each pair and use its probability to order the review queue.
- Show amount, date, and account evidence. A user must confirm before Fluxby changes either transaction.
- Apply a confirmed pair atomically and preserve the existing exact-IBAN detector.

## Acceptance criteria

- No configured key means no Jev request and no change to existing import or cleanup behavior.
- Every Choice workflow includes a no-match option and uses only candidates built by Fluxby code.
- All responses are schema-checked and candidate IDs or headers are validated before use.
- Ambiguous or low-confidence results go to manual review; no AI result deletes a transaction or silently merges contacts.
- User-facing text is translated in Dutch and English, and Help Center or integration docs describe any new user-visible workflow.
- Review a labeled dataset for accuracy, confidence, coverage, latency, and request volume before making quality claims; implementation alone does not establish model accuracy.

## TypeSafe references

- [Example use cases](https://docs.typesafe.ai/concepts/use-case-map) — classification, extraction, retrieval, and ranking patterns.
- [Choice](https://docs.typesafe.ai/primitives/choice) — closed-set selection and explicit `none` options.
- [Noul](https://docs.typesafe.ai/primitives/noul) — a single yes/no judgment for transfer-pair review.
- [Confidence](https://docs.typesafe.ai/confidence) — probability-derived confidence and thresholds scaled to action risk.
