# TypeSafe AI Integration

Fluxby uses [TypeSafe AI](https://typesafe.ai) to replace fragile regex-and-heuristic
code with narrow, calibrated AI judgments. The integration follows TypeSafe's
_AI-powered software_ architecture: code owns all control flow, and the model handles
only the parts that require semantic understanding.

## How it works

TypeSafe's **System One** model (Jev) returns structured answers — not generated text.
Each call provides:

- **State** — the relevant data to evaluate (transaction fields, CSV sample rows, etc.)
- **Questions** — typed yes/no (Noul), one-of-many (Choice), or ranked-level (Score) decisions
- **Answers** — probabilities and, for Choice/Score, a confidence value your code can threshold

Code combines those answers with deterministic rules. TypeSafe handles the parts that
require common sense about unstructured data; everything else stays in code.

## Setup

1. Go to the **App Settings** tab in Settings
2. Scroll to the **TypeSafe AI** card
3. Enter your API key — get one at [console.typesafe.ai/keys](https://console.typesafe.ai/keys)

All AI features are opt-in. If no key is configured, every integration silently falls
back to existing deterministic behaviour.

## Web and Tauri transport

The user-supplied key remains the switch that enables the feature. Fluxby never
ships a shared TypeSafe key.

- **Tauri** invokes the fixed-endpoint `typesafe_request` Rust command, which
  sends native HTTPS to `https://api.typesafe.ai/v1/systemone`. Browser fetch
  inside the webview is still subject to CORS and must not be used here.
  The command has a 15-second timeout, disables redirects, and returns the
  provider's HTTP status and body without logging the API key.
- **GitHub Pages web** sends the same request through the optional
  `api.fluxby.app` Cloudflare Worker. The Worker exists only to handle browser
  CORS; it forwards the user's key for that request and does not store keys or
  request bodies. Configure another deployed URL with
  `VITE_TYPESAFE_WEB_PROXY_URL` when needed.
- **Development** uses the Vite same-origin `/typesafe-api` proxy.

Deploy the Worker from [`workers/typesafe-proxy/README.md`](../workers/typesafe-proxy/README.md)
before enabling the production web path. The web build can override its endpoint
with `VITE_TYPESAFE_WEB_PROXY_URL`.

## Where TypeSafe is used

### 1. Transaction categorisation

**File**: `apps/web/src/lib/data-service.ts` → `applyCategoriesToUncategorized()`

**Trigger**: the uncategorized-transactions action in TypeSafe AI Settings, or a
successful CSV import when a TypeSafe API key is configured.

**What it does**: After the regex-rule engine runs, any transaction that still has no
category is sent to TypeSafe. The model picks the best-matching category from the
user's own category list.

Use the **Jev trace** toggle in Settings to inspect a session-only copy of each
request and response (never the API key). **Test Jev connection** sends one harmless
typed question without transaction data, useful for verifying console usage.

**Question type**: Choice  
**State**: `{ merchant, description, amount }`  
**Threshold**: confidence > 0.6 to auto-assign; otherwise skipped
**Batch size**: at most five items, also split at a conservative 12,000-byte
request estimate. Compact choice IDs replace repeated category UUIDs and are
mapped back to database IDs after validation. All category options are retained.
If Jev returns `max_tokens_exceeded`, the batch is halved recursively; a
single-item failure is surfaced rather than retried indefinitely. Other errors
are surfaced immediately. The same batching applies to discovered category
rules, which now review all qualifying merchants rather than only the first 30.
The provider permits at most 255 choices, including the `none` option.

```json
{
  "state": {
    "merchant": "Albert Heijn",
    "description": "PIN betaling",
    "amount": -24.8
  },
  "questions": {
    "category": {
      "type": "choice",
      "instructions": "Which spending category best fits the bank transaction described in `merchant`, `description`, and `amount`?",
      "criteria": {
        "cat-uuid-1": "Supermarkt",
        "cat-uuid-2": "Restaurants & Bars",
        "none": "Does not fit any of these categories"
      }
    }
  }
}
```

---

### 2. CSV import — date format disambiguation

**File**: `apps/web/src/lib/data-service.ts` → `importCsv()` (pre-pass)

**Trigger**: Any CSV import using the generic bank path.

**What it does**: The parser ordinarily assumes DD/MM/YYYY for ambiguous dates like
`01/02/2024`. Before processing rows, a pre-pass collects up to 10 sample dates and
asks TypeSafe which convention the bank uses. If confidence ≥ 0.8, the AI result
overrides the parser's default guess — preventing silent date corruption for US-format
or non-Dutch bank exports.

**Question type**: Choice  
**State**: `{ sampleDates: ["01/02/2024", "15/03/2024", ...] }`  
**Threshold**: confidence ≥ 0.8 to override; lower → default parser runs unchanged

---

### 3. CSV import — direction column inference

**File**: `apps/web/src/lib/data-service.ts` → `importCsv()` (pre-pass)

**Trigger**: Any CSV import that has an explicit debit/credit direction column.

**What it does**: The parser recognises a hardcoded set of direction values (`af`,
`bij`, `debit`, `credit`, `d`, `c`, `+`, `-`). For any value _not_ in that set (e.g.
`Belastung`, `Débit`, unusual bank codes), TypeSafe classifies each unique value in
one parallel batch request before the row loop starts.

**Question type**: Choice (one per unique unknown value)  
**State**: `{ directionValues: ["Belastung", "Gutschrift"] }`  
**Criteria per question**: `debit`, `credit`, `unknown`

---

### 4. Payment provider detection

**File**: `apps/web/src/lib/data-service.ts` → `detectPaymentProvidersWithAI()`

**Trigger**: "Detect payment providers" button in the TypeSafe AI settings card.

**What it does**: Finds IBANs that appear with two or more different merchant names
(a signal the IBAN belongs to an intermediary like PayPal or Tikkie) and where the
existing pattern rules returned no match. TypeSafe evaluates each candidate IBAN to
decide whether it belongs to a payment processor.

**Question type**: Noul  
**State**: `{ iban, merchantNames: [...], description }`  
**Threshold**: P(is_provider) ≥ 0.75 → marks all transactions for that IBAN as
`payment_provider = 'AI-detected'`  
**Cap**: 30 IBANs per invocation, run in parallel

---

### 5. Recurring subscription merchant grouping

**File**: `apps/web/src/lib/data-service.ts` → `_detectRecurringPatternsImpl()`

**Trigger**: "Detect recurring patterns" button on the Subscriptions page.

**What it does**: After the initial grouping by normalised merchant name, TypeSafe
checks IBANs that produced more than one distinct normalised name (e.g. `"netflix"`
and `"netflix premium"` from the same IBAN). If confirmed as the same service, the
groups are merged before the interval-consistency analysis runs, so the pattern
detection sees the complete transaction history.

**Question type**: Noul  
**State**: `{ iban, merchantNames: ["netflix", "netflix premium"] }`  
**Threshold**: P(same_service) ≥ 0.75 → groups merged

---

### 6. Semantic duplicate detection

**File**: `apps/web/src/lib/data-service.ts` → `findSemanticDuplicates()`

**Trigger**: "Scan for duplicates" button in the TypeSafe AI settings card.

**What it does**: Finds transaction pairs with the same amount and dates within one
day apart but different import hashes (meaning the hash-based deduplication skipped
them). TypeSafe evaluates each pair to decide whether they represent the same
real-world payment charged twice.

- **Question type**: Noul
- **State**: `{ tx1: {date, amount, description}, tx2: {date, amount, description} }`
- **Threshold**: P(same_event) ≥ 0.75 → surfaced in the review dialog
- **Cap**: 20 candidate pairs per scan
- **Action**: read-only review — never auto-deletes

---

### 7. CSV import — column mapping

**File**: `apps/web/src/pages/Import.tsx` → `handleParseCSV()` and
`apps/web/src/lib/typesafe-client.ts` → `suggestImportColumnMappings()`

**Trigger**: A required date, amount, or description mapping is missing or
ambiguous, and the user has configured a TypeSafe key. CSV files are parsed
locally and passed through the existing preview and import path.

**What it does**: Jev chooses only among the file's actual column headers or
`unmapped`. Fluxby sends the headers and up to two short sample rows containing
date, amount, or description candidate columns. The mapping appears in the
existing review form; the user must inspect the mapping and transaction preview
before importing. Invalid header choices are rejected.

- **Question type**: Choice (one per unresolved required field)
- **Threshold**: confidence ≥ 0.6 to prefill; lower confidence stays manual
- **Safety**: no workbook or full transaction list is uploaded

---

### 8. Address book identity suggestions

**File**: `apps/web/src/pages/AddressBook.tsx` → contact match review and
`apps/web/src/lib/typesafe-client.ts` → `suggestAddressBookMatches()`

**Trigger**: the user chooses **Suggest contact matches with Jev** in the
Address Book. The user key is required.

**What it does**: Fluxby deduplicates the unlinked IBAN groups locally and uses
name similarity to build a short list of existing contact candidates. Jev sees
counterparty/contact names and transaction counts, but no IBAN. A closed Choice
question always includes `none`. The address book shows proposed matches and
confidence; linking an IBAN uses the existing contact-link action only after
the user confirms each row. Jev never creates or merges contacts.

- **Question type**: Choice (one per counterparty)
- **Threshold**: confidence ≥ 0.6 to show a suggestion
- **Cap**: 40 unlinked IBANs per run; at most 24 similar contact candidates per counterparty

---

### 9. Possible internal transfer review

**File**: `apps/web/src/lib/data-service.ts` →
`findPossibleInternalTransfers()` and `markTransactionsAsTransfers()`

**Trigger**: the user chooses **Review possible internal transfers** in TypeSafe
AI Settings. The existing exact own-IBAN detector remains unchanged.

**What it does**: deterministic code finds equal, opposite-sign transactions on
different user accounts within three days, excluding entries whose counterparty
IBAN already matches one of the user's own accounts. Jev evaluates those
candidates and orders a review list. The user explicitly marks both entries;
the two updates run together in one database transaction.

- **Question type**: Noul (one per candidate pair)
- **Threshold**: P(transfer) ≥ 0.5 to surface for review
- **Cap**: 30 candidate pairs per run
- **State**: account names, dates, amounts, and short descriptions; no IBANs

---

## Design principles

These integrations follow the TypeSafe building guide:

| Principle                    | How it's applied                                                                                                                                              |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Code owns control flow**   | All routing, thresholds, and database writes are in TypeScript. TypeSafe only returns probabilities.                                                          |
| **Atomic questions**         | Each question judges one dimension. `suggestCategories` asks one category-fit Choice per transaction; `is_provider` asks only about intermediary status.      |
| **Structured state**         | State is a named JSON object with only the fields relevant to the question.                                                                                   |
| **Backtick path references** | Instructions reference state fields by path (e.g. `` `merchant` ``, `` `iban` ``) where clarity helps.                                                        |
| **Confidence thresholds**    | Higher confidence is required for higher-consequence actions (0.8 for date format override; strictly above 0.6 for category auto-assign and generated rules). |
| **Graceful degradation**     | Every integration checks for the key first. On API error, existing deterministic behaviour runs unchanged.                                                    |
| **No auto-delete**           | Semantic duplicate detection surfaces candidates only — the user decides.                                                                                     |

## Confidence thresholds reference

| Feature               | Primitive             | Threshold | Action                        |
| --------------------- | --------------------- | --------- | ----------------------------- |
| Category suggestion   | Choice confidence     | > 0.6     | Auto-assign category          |
| Date format detection | Choice confidence     | ≥ 0.8     | Override DD/MM vs MM/DD       |
| Direction inference   | Choice (no threshold) | —         | Used if non-empty             |
| Import column mapping | Choice confidence     | ≥ 0.6     | Prefill for user review       |
| Address book matching | Choice confidence     | ≥ 0.6     | Surface link for confirmation |
| Payment provider      | Noul                  | ≥ 0.75    | Mark as AI-detected provider  |
| Recurring grouping    | Noul                  | ≥ 0.75    | Merge merchant groups         |
| Duplicate detection   | Noul                  | ≥ 0.75    | Surface for user review       |
| Transfer pair review  | Noul                  | ≥ 0.5     | Surface pair for review       |

## Key files

| File                                                    | Role                                                                                   |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `apps/web/src/lib/typesafe-client.ts`                   | Web/Tauri transport selection, fetch wrapper, question helpers, domain functions       |
| `workers/typesafe-proxy/src/index.js`                   | GitHub Pages CORS proxy; forwards user-supplied keys without storing them              |
| `apps/web/src/components/settings/TypeSafeSettings.tsx` | Settings UI — key input, actions, duplicate and transfer review dialogs                |
| `apps/web/src/lib/data-service.ts`                      | Eight domain integration points                                                        |
| `apps/web/src/lib/api-compat.ts`                        | Exposes `detectPaymentProvidersWithAI` and `findSemanticDuplicates` to the React layer |

## Further reading

- [TypeSafe docs](https://docs.typesafe.ai)
- [TypeSafe Worker deployment](../workers/typesafe-proxy/README.md)
- [How to build with System One](https://docs.typesafe.ai/concepts/how-to-build-with-system-one)
- [Primitives (Choice, Score, Noul)](https://docs.typesafe.ai/primitives)
- [Confidence and thresholds](https://docs.typesafe.ai/confidence)
- [Pre-parsed value extraction cookbook](https://docs.typesafe.ai/cookbooks/pre_parsed_value_extraction_cookbook) — most closely matches the CSV import pattern
- [Hierarchical classification cookbook](https://docs.typesafe.ai/cookbooks/hierarchical_classification) — most closely matches the categorisation pattern
