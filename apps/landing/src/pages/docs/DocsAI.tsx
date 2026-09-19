import { ExternalLink } from 'lucide-react';
import CodeBlock from '../../components/docs/CodeBlock';

const exampleRequest = `{
  "state": {
    "merchant": "Albert Heijn",
    "description": "PIN betaling",
    "amount": -24.80
  },
  "model": "jev-latest",
  "questions": {
    "category": {
      "type": "choice",
      "instructions": "Which spending category best fits the bank transaction described in \`merchant\`, \`description\`, and \`amount\`?",
      "criteria": {
        "cat-uuid-supermarkt": "Supermarkt",
        "cat-uuid-restaurant": "Restaurants & Bars",
        "cat-uuid-transport": "Transport",
        "none": "Does not fit any of these categories"
      }
    }
  }
}`;

const exampleResponse = `{
  "model": "jev-latest",
  "answers": {
    "category": {
      "type": "choice",
      "choice": "cat-uuid-supermarkt",
      "probabilities": {
        "cat-uuid-supermarkt": 0.94,
        "cat-uuid-restaurant": 0.04,
        "cat-uuid-transport": 0.01,
        "none": 0.01
      },
      "confidence": 0.91
    }
  },
  "usage": { "input_tokens": 248, "output_tokens": 42 }
}`;

const directionExample = `// Before the row loop in importCsv()
// TypeSafe classifies each unknown direction value once, in parallel

{
  "state": { "directionValues": ["Belastung", "Gutschrift"] },
  "model": "jev-latest",
  "questions": {
    "v0": {
      "type": "choice",
      "instructions": "A bank CSV has a direction column whose value is \\"Belastung\\". Does this mean money is leaving the account or arriving?",
      "criteria": {
        "debit": "Money leaving the account (payment, expense, withdrawal)",
        "credit": "Money arriving (income, deposit, refund)",
        "unknown": "Cannot determine from this value alone"
      }
    },
    "v1": {
      "type": "choice",
      "instructions": "A bank CSV has a direction column whose value is \\"Gutschrift\\". ...",
      "criteria": { "debit": "...", "credit": "...", "unknown": "..." }
    }
  }
}`;

const clientExample = `import {
  suggestCategory,
  detectDirectionConvention,
  detectDateFormat,
  detectIsPaymentProvider,
  getTypeSafeApiKey,
} from '@/lib/typesafe-client';

// User's key read from OPFS settings — only present if they opt in
const key = getTypeSafeApiKey();
if (!key) return; // graceful degradation

const suggestion = await suggestCategory({
  merchantName: 'Albert Heijn',
  description: 'PIN betaling',
  amount: -24.80,
  categories: userCategories,   // user's own category list
  apiKey: key,
});

if (suggestion && suggestion.confidence >= 0.7) {
  // code owns the write — TypeSafe only returned a probability
  await db.runAsync(
    'UPDATE transactions SET category_id = ? WHERE id = ?',
    [suggestion.categoryId, transactionId]
  );
}`;

export default function DocsAI() {
  return (
    <article className='prose prose-gray dark:prose-invert max-w-none'>
      <h1 className='mb-4 text-4xl font-bold text-gray-900 dark:text-gray-100'>
        TypeSafe AI / Jev
      </h1>
      <p className='text-xl text-gray-600 dark:text-gray-400'>
        How Fluxby uses TypeSafe's System One model (Jev) to replace fragile
        regex rules with calibrated, structured AI judgments.
      </p>

      {/* What is TypeSafe */}
      <div className='mt-8 rounded-xl border border-purple-200 bg-purple-50 p-6 dark:border-purple-800 dark:bg-purple-950/30'>
        <h3 className='mt-0 mb-2 flex items-center gap-2 text-lg font-semibold text-purple-900 dark:text-purple-200'>
          <span>✨</span> What is TypeSafe AI?
        </h3>
        <p className='mb-2 text-purple-800 dark:text-purple-300'>
          <a
            href='https://typesafe.ai'
            target='_blank'
            rel='noopener noreferrer'
            className='font-medium underline'
          >
            TypeSafe
          </a>{' '}
          builds <strong>System One</strong> models — small, fast AI primitives
          that return structured answers instead of generated text.{' '}
          <strong>Jev</strong> is TypeSafe's flagship model. Given a state (JSON
          or string) and one or more typed questions, it returns probabilities
          for Choice, Score, or Noul (yes/no) answers in ~100 ms.
        </p>
        <p className='mb-0 text-purple-800 dark:text-purple-300'>
          Code owns the control flow. Jev handles only the parts that require
          semantic understanding of unstructured text — such as "which category
          fits this merchant name?" or "is this IBAN a payment intermediary?".
        </p>
      </div>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        Architecture
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        Fluxby follows TypeSafe's <em>AI-powered software</em> pattern: keep
        deterministic work in code, and insert AI only where heuristics break
        down.
      </p>

      <div className='not-prose mt-6 overflow-x-auto'>
        <table className='w-full border-collapse text-sm'>
          <thead>
            <tr className='border-b text-left'>
              <th className='py-2 pr-4 font-medium'>Decision</th>
              <th className='py-2 pr-4 font-medium'>Primitive</th>
              <th className='py-2 font-medium'>Replaces</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['Transaction category', 'Choice', 'Regex rule engine fallback'],
              ['CSV date format', 'Choice', 'Fixed-order format guesser'],
              [
                'Direction column values',
                'Choice',
                'Hardcoded af/bij/debit list',
              ],
              ['Payment provider detection', 'Noul', 'Substring pattern list'],
              [
                'Recurring merchant grouping',
                'Noul',
                'Dutch month-name stripper',
              ],
              ['Semantic duplicate check', 'Noul', 'Hash-only deduplication'],
            ].map(([decision, primitive, replaces]) => (
              <tr key={decision} className='border-b last:border-0'>
                <td className='py-2 pr-4 font-medium text-gray-900 dark:text-gray-100'>
                  {decision}
                </td>
                <td className='py-2 pr-4'>
                  <span className='rounded bg-purple-100 px-2 py-0.5 font-mono text-xs text-purple-800 dark:bg-purple-900 dark:text-purple-200'>
                    {primitive}
                  </span>
                </td>
                <td className='py-2 text-gray-500 dark:text-gray-400'>
                  {replaces}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        Opt-in — all features are gracefully degraded
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        Every TypeSafe integration checks for an API key before calling the
        service. If the key is absent or the call fails, the existing
        deterministic logic runs unchanged. Users who do not configure a key see
        no change in behaviour.
      </p>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        Client implementation
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        Because Fluxby is a local-first web app (no backend server), TypeSafe is
        called directly from the browser via the HTTP API.{' '}
        <code>apps/web/src/lib/typesafe-client.ts</code> wraps{' '}
        <code>fetch</code> and exposes domain helpers:
      </p>
      <CodeBlock language='typescript' code={clientExample} />

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        Example: transaction categorisation
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        When the regex-rule engine cannot match a transaction, Fluxby sends the
        merchant name, description, and amount to Jev alongside the user's own
        category list. Jev returns a probability for each category.
      </p>

      <h3 className='mt-6 text-lg font-semibold text-gray-900 dark:text-gray-100'>
        Request
      </h3>
      <CodeBlock language='json' code={exampleRequest} />

      <h3 className='mt-6 text-lg font-semibold text-gray-900 dark:text-gray-100'>
        Response
      </h3>
      <CodeBlock language='json' code={exampleResponse} />

      <p className='text-gray-600 dark:text-gray-400'>
        Fluxby only applies the suggestion when{' '}
        <code>confidence &gt;= 0.7</code>. Below that threshold, the transaction
        remains uncategorised and the user assigns the category manually.
      </p>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        Example: CSV direction column inference
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        For bank exports with non-standard direction column values (e.g. German
        "Belastung"/"Gutschrift"), Fluxby asks Jev to classify each unique value
        in one parallel batch before processing rows.
      </p>
      <CodeBlock language='json' code={directionExample} />

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        Confidence thresholds
      </h2>
      <div className='not-prose mt-4 overflow-x-auto'>
        <table className='w-full border-collapse text-sm'>
          <thead>
            <tr className='border-b text-left'>
              <th className='py-2 pr-4 font-medium'>Feature</th>
              <th className='py-2 pr-4 font-medium'>Primitive</th>
              <th className='py-2 pr-4 font-medium'>Threshold</th>
              <th className='py-2 font-medium'>Action if met</th>
            </tr>
          </thead>
          <tbody>
            {[
              [
                'Category suggestion',
                'Choice confidence',
                '≥ 0.7',
                'Auto-assign category',
              ],
              [
                'Date format detection',
                'Choice confidence',
                '≥ 0.8',
                'Override parser default',
              ],
              [
                'Direction inference',
                'Choice',
                '—',
                'Used if answer is not "unknown"',
              ],
              [
                'Payment provider',
                'Noul',
                '≥ 0.75',
                'Mark as AI-detected provider',
              ],
              ['Recurring grouping', 'Noul', '≥ 0.75', 'Merge merchant groups'],
              [
                'Duplicate detection',
                'Noul',
                '≥ 0.75',
                'Surface for user review',
              ],
            ].map(([feat, prim, thresh, action]) => (
              <tr key={feat} className='border-b last:border-0'>
                <td className='py-2 pr-4 font-medium text-gray-900 dark:text-gray-100'>
                  {feat}
                </td>
                <td className='py-2 pr-4 font-mono text-xs text-gray-600 dark:text-gray-400'>
                  {prim}
                </td>
                <td className='py-2 pr-4 font-mono text-xs'>{thresh}</td>
                <td className='py-2 text-sm text-gray-500 dark:text-gray-400'>
                  {action}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        Privacy and data flow
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        When TypeSafe AI is enabled, the following data is sent to the TypeSafe
        API for each request:
      </p>
      <ul className='text-gray-600 dark:text-gray-400'>
        <li>
          <strong>Category suggestion:</strong> merchant name, description text,
          and transaction amount
        </li>
        <li>
          <strong>Direction inference:</strong> unique direction column values
          from the CSV sample
        </li>
        <li>
          <strong>Date format detection:</strong> up to 10 sample date strings
          from the CSV
        </li>
        <li>
          <strong>Payment provider detection:</strong> IBAN and merchant names
        </li>
        <li>
          <strong>Recurring grouping:</strong> IBAN and normalised merchant
          names
        </li>
        <li>
          <strong>Duplicate detection:</strong> date, amount, and description of
          candidate transaction pairs
        </li>
      </ul>
      <p className='text-gray-600 dark:text-gray-400'>
        No TypeSafe calls are made without a user-supplied API key. Review the{' '}
        <a
          href='https://typesafe.ai/legal'
          target='_blank'
          rel='noopener noreferrer'
        >
          TypeSafe privacy policy
        </a>{' '}
        for details on data handling.
      </p>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        Further reading
      </h2>
      <ul className='space-y-1 text-gray-600 dark:text-gray-400'>
        {[
          ['TypeSafe documentation', 'https://docs.typesafe.ai'],
          [
            'How to build with System One',
            'https://docs.typesafe.ai/concepts/how-to-build-with-system-one',
          ],
          [
            'Primitives (Choice, Score, Noul)',
            'https://docs.typesafe.ai/primitives',
          ],
          ['Confidence and thresholds', 'https://docs.typesafe.ai/confidence'],
          [
            'Pre-parsed value extraction cookbook',
            'https://docs.typesafe.ai/cookbooks/pre_parsed_value_extraction_cookbook',
          ],
          [
            'Hierarchical classification cookbook',
            'https://docs.typesafe.ai/cookbooks/hierarchical_classification',
          ],
          [
            'Internal reference: docs/TYPESAFE-INTEGRATION.md',
            'https://github.com/fluxby-app/fluxby/blob/main/docs/TYPESAFE-INTEGRATION.md',
          ],
        ].map(([label, href]) => (
          <li key={href}>
            <a
              href={href}
              target='_blank'
              rel='noopener noreferrer'
              className='inline-flex items-center gap-1'
            >
              {label}
              <ExternalLink className='h-3 w-3' />
            </a>
          </li>
        ))}
      </ul>
    </article>
  );
}
