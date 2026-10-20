# Dutch bank-feed feasibility — 1 October 2026

Status: research; no production connector or live sandbox proof. Core imports remain local and independent of a provider. No provider account, application certificate or credentials were supplied to this task. Do not describe a mocked adapter as a completed bank integration.

## Candidate assessment

| Candidate | Evidence | Decision for Fluxby |
| --- | --- | --- |
| Enable Banking | Its API documents institution discovery, redirect consent, sessions and transaction retrieval. Authentication requires an application ID and private-key-signed JWT. Sandbox registration is separate from production. | Plausible candidate for a bounded prototype. A protected credential service is needed for a shared product; never embed the application's signing key in the static PWA or desktop bundle. |
| Tink | Its FAQ offers console test data and distinguishes product coverage, commercial pricing and production access. | Alternative to evaluate against the same Dutch consumer products. Broad European bank counts do not establish account-information coverage for a particular Dutch account. |

Sources checked: [Enable Banking API reference](https://enablebanking.com/docs/api/reference/), [Enable Banking FAQ](https://enablebanking.com/docs/faq/), [Tink FAQ](https://tink.com/faq/). These are supplier descriptions, not measured connection reliability.

## Exact coverage and cost gate

| Target | Personal current account | Savings account | History / pending identity | Reauthorization and fees |
| --- | --- | --- | --- | --- |
| ING Netherlands | Unverified in an authenticated provider directory | Unverified | Unverified | Unverified |
| ASN Bank Netherlands | Unverified | Unverified | Unverified | Unverified |
| Rabobank Netherlands | Unverified | Unverified | Unverified | Unverified |
| ABN AMRO Netherlands | Unverified | Unverified | Unverified | Unverified |

Obtain a dated provider-directory response and complete a consent flow for every supported product before displaying it as available. Record institution IDs, supported account types, history depth, balance timestamps, booked/pending identities, request limits and observed expiry. Obtain commercial quotes including minimum commitments, active users, connections, refresh costs and support; no zero-cost production assumption is justified here.

## Proposed credential and consent boundary

The PWA requests a short-lived connection session from an optional credential service. That service signs provider calls, binds callback state to the initiating user/session and keeps provider credentials out of OPFS backups and peer sync. The provider and bank handle authorization; the app never collects bank passwords. The browser receives normalized EUR account/transaction data for an explicit local import. Disconnection revokes the provider session and removes server-side connection secrets. File imports must keep working when the service is unavailable.

This changes the data path of the optional connected feature and requires a product decision on hosting and data handling before production. It does not change the local-first storage contract of existing features.

## Reproducible sandbox acceptance checklist

1. Register a sandbox app and an exact HTTPS callback; keep the private key in the protected service environment.
2. List institutions for country NL. Save product coverage evidence and distinguish simulated providers from live banks.
3. Start authorization with unpredictable session-bound state; exercise consent success, cancellation, invalid state, expired code and replay rejection.
4. Exchange the code, list accounts and page transaction history. Verify EUR amounts, dates, counterparty/SEPA references, stable IDs, pending-to-booked behavior and cursor exhaustion.
5. Feed a repeated/overlapping response through duplicate detection; verify profile isolation and consistent balances without deleting user edits.
6. Revoke the session and verify future refresh fails cleanly. Record costs/limits/expiry from the agreed product rather than hardcoding a universal consent duration.

The external sandbox portion is pending credentials and provider selection. This document completes the preliminary architecture assessment; it does not claim completion of NL06's authenticated proof.

## Structured Dutch files

CAMT.053 and MT940 remain conditional in the approved comparison: introduce a bank/product adapter after representative exports demonstrate a need. CSV/TAB adapters now have synthetic fixtures, not customer-bank certification. A future structured adapter must validate currency, namespace/version, entry versus batch detail totals, reversals and references. Never import both an aggregate entry and its child transactions. No tax/payroll or non-Dutch expansion is included.
