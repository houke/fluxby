# TypeSafe AI Integration

Fluxby uses [TypeSafe AI](https://typesafe.ai) to replace fragile regex-and-heuristic
code with narrow, calibrated AI judgments. The integration follows TypeSafe's
*AI-powered software* architecture: code owns all control flow, and the model handles
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

## Where TypeSafe is used

### 1. Transaction categorisation

**File**: `apps/web/src/lib/data-service.ts` → `applyCategoriesToUncategorized()`

**Trigger**: "Apply rules" button in the Categories page, or after CSV import.

**What it does**: After the regex-rule engine runs, any transaction that still has no
category is sent to TypeSafe. The model picks the best-matching category from the
user's own category list.

**Question type**: Choice  
**State**: `{ merchant, description, amount }`  
**Threshold**: confidence ≥ 0.7 to auto-assign; otherwise skipped  
**Batch size**: up to 50 transactions per invocation, run in parallel

```json
{
  "state": { "merchant": "Albert Heijn", "description": "PIN betaling", "amount": -24.80 },
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
`bij`, `debit`, `credit`, `d`, `c`, `+`, `-`). For any value *not* in that set (e.g.
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

**Question type**: Noul  
**State**: `{ tx1: {date, amount, description}, tx2: {date, amount, description} }`  
**Threshold**: P(same_event) ≥ 0.75 → surfaced in the review dialog  
**Cap**: 20 candidate pairs per scan  
**Action**: read-only review — never auto-deletes

---

## Design principles

These integrations follow the TypeSafe building guide:

| Principle | How it's applied |
|---|---|
| **Code owns control flow** | All routing, thresholds, and database writes are in TypeScript. TypeSafe only returns probabilities. |
| **Atomic questions** | Each question judges one dimension. `suggestCategory` asks only about category fit; `is_provider` asks only about intermediary status. |
| **Structured state** | State is a named JSON object with only the fields relevant to the question. |
| **Backtick path references** | Instructions reference state fields by path (e.g. `` `merchant` ``, `` `iban` ``) where clarity helps. |
| **Confidence thresholds** | Higher confidence required for higher-consequence actions (0.8 for date format override; 0.7 for category auto-assign). |
| **Graceful degradation** | Every integration checks for the key first. On API error, existing deterministic behaviour runs unchanged. |
| **No auto-delete** | Semantic duplicate detection surfaces candidates only — the user decides. |

## Confidence thresholds reference

| Feature | Primitive | Threshold | Action |
|---|---|---|---|
| Category suggestion | Choice confidence | ≥ 0.7 | Auto-assign category |
| Date format detection | Choice confidence | ≥ 0.8 | Override DD/MM vs MM/DD |
| Direction inference | Choice (no threshold) | — | Used if non-empty |
| Payment provider | Noul | ≥ 0.75 | Mark as AI-detected provider |
| Recurring grouping | Noul | ≥ 0.75 | Merge merchant groups |
| Duplicate detection | Noul | ≥ 0.75 | Surface for user review |

## Key files

| File | Role |
|---|---|
| `apps/web/src/lib/typesafe-client.ts` | Browser fetch wrapper, question helpers, domain functions |
| `apps/web/src/components/settings/TypeSafeSettings.tsx` | Settings UI — key input, action buttons, duplicates dialog |
| `apps/web/src/lib/data-service.ts` | Six integration points |
| `apps/web/src/lib/api-compat.ts` | Exposes `detectPaymentProvidersWithAI` and `findSemanticDuplicates` to the React layer |

## Further reading

- [TypeSafe docs](https://docs.typesafe.ai)
- [How to build with System One](https://docs.typesafe.ai/concepts/how-to-build-with-system-one)
- [Primitives (Choice, Score, Noul)](https://docs.typesafe.ai/primitives)
- [Confidence and thresholds](https://docs.typesafe.ai/confidence)
- [Pre-parsed value extraction cookbook](https://docs.typesafe.ai/cookbooks/pre_parsed_value_extraction_cookbook) — most closely matches the CSV import pattern
- [Hierarchical classification cookbook](https://docs.typesafe.ai/cookbooks/hierarchical_classification) — most closely matches the categorisation pattern
