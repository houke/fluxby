import { ExternalLink } from 'lucide-react';
import CodeBlock from '../../components/docs/CodeBlock';
import { useLanguage } from '../../contexts/LanguageContext';

const exampleRequest = (language: 'en' | 'nl') => {
  const merchant = language === 'nl' ? 'Albert Heijn' : 'Example Market';
  const description = language === 'nl' ? 'PIN betaling' : 'Card payment';
  const category = language === 'nl' ? 'Supermarkt' : 'Groceries';
  const instructions =
    language === 'nl'
      ? 'Welke uitgavencategorie past het beste bij de banktransactie in `merchant`, `description` en `amount`?'
      : 'Which spending category best fits the bank transaction described in `merchant`, `description`, and `amount`?';
  const restaurants =
    language === 'nl' ? 'Restaurants & cafés' : 'Restaurants & Bars';
  const transport = language === 'nl' ? 'Vervoer' : 'Transport';
  const noCategory =
    language === 'nl'
      ? 'Past bij geen van deze categorieën'
      : 'Does not fit any of these categories';
  const [groceriesId, restaurantsId, transportId] = [
    'cat-uuid-1',
    'cat-uuid-2',
    'cat-uuid-3',
  ];

  return `{
  "state": {
    "merchant": "${merchant}",
    "description": "${description}",
    "amount": -24.80
  },
  "model": "jev-latest",
  "questions": {
    "category": {
      "type": "choice",
      "instructions": "${instructions}",
      "criteria": {
        "${groceriesId}": "${category}",
        "${restaurantsId}": "${restaurants}",
        "${transportId}": "${transport}",
        "none": "${noCategory}"
      }
    }
  }
}`;
};

const exampleResponse = `{
  "model": "jev-latest",
  "answers": {
    "category": {
      "type": "choice",
      "choice": "cat-uuid-1",
      "probabilities": {
        "cat-uuid-1": 0.94,
        "cat-uuid-2": 0.04,
        "cat-uuid-3": 0.01,
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

const clientExample = (language: 'en' | 'nl') => {
  const merchant = language === 'nl' ? 'Albert Heijn' : 'Example Market';
  const description = language === 'nl' ? 'PIN betaling' : 'Card payment';

  return `import {
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
  merchantName: '${merchant}',
  description: '${description}',
  amount: -24.80,
  categories: userCategories,   // user's own category list
  apiKey: key,
});

if (suggestion && suggestion.confidence > 0.7) {
  // code owns the write — TypeSafe only returned a probability
  await db.runAsync(
    'UPDATE transactions SET category_id = ? WHERE id = ?',
    [suggestion.categoryId, transactionId]
  );
}`;
};

export default function DocsAI() {
  const { t, language } = useLanguage();
  const copy = t.docs.ai;

  return (
    <article className='prose prose-gray dark:prose-invert max-w-none'>
      <h1 className='mb-4 text-4xl font-bold text-gray-900 dark:text-gray-100'>
        {copy.title}
      </h1>
      <p className='text-xl text-gray-600 dark:text-gray-400'>
        {copy.subtitle}
      </p>

      <div className='mt-8 rounded-xl border border-purple-200 bg-purple-50 p-6 dark:border-purple-800 dark:bg-purple-950/30'>
        <h3 className='mt-0 mb-2 flex items-center gap-2 text-lg font-semibold text-purple-900 dark:text-purple-200'>
          <span>✨</span> {copy.whatTitle}
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
          {copy.whatText}
        </p>
        <p className='mb-0 text-purple-800 dark:text-purple-300'>
          {copy.controlText}
        </p>
      </div>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {copy.architectureTitle}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {copy.architectureIntro}
      </p>
      <div className='not-prose mt-6 overflow-x-auto'>
        <table className='w-full border-collapse text-sm'>
          <thead>
            <tr className='border-b text-left'>
              {copy.decisionHeaders.map((header: string) => (
                <th key={header} className='py-2 pr-4 font-medium'>
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {copy.decisions.map(
              ([decision, primitive, replaces]: [string, string, string]) => (
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
              )
            )}
          </tbody>
        </table>
      </div>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {copy.optInTitle}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>{copy.optInText}</p>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {copy.implementationTitle}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {copy.implementationText}
      </p>
      <p className='text-gray-600 dark:text-gray-400'>{copy.workerText}</p>
      <CodeBlock language='typescript' code={clientExample(language)} />

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {copy.categoryExampleTitle}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {copy.categoryExampleText}
      </p>
      <h3 className='mt-6 text-lg font-semibold text-gray-900 dark:text-gray-100'>
        {copy.request}
      </h3>
      <CodeBlock language='json' code={exampleRequest(language)} />
      <h3 className='mt-6 text-lg font-semibold text-gray-900 dark:text-gray-100'>
        {copy.response}
      </h3>
      <CodeBlock language='json' code={exampleResponse} />
      <p className='text-gray-600 dark:text-gray-400'>{copy.confidenceText}</p>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {copy.directionExampleTitle}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>{copy.directionText}</p>
      <CodeBlock language='json' code={directionExample} />

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {copy.thresholdsTitle}
      </h2>
      <div className='not-prose mt-4 overflow-x-auto'>
        <table className='w-full border-collapse text-sm'>
          <thead>
            <tr className='border-b text-left'>
              {copy.thresholdHeaders.map((header: string) => (
                <th key={header} className='py-2 pr-4 font-medium'>
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {copy.thresholds.map(
              ([feature, primitive, threshold, action]: [
                string,
                string,
                string,
                string,
              ]) => (
                <tr key={feature} className='border-b last:border-0'>
                  <td className='py-2 pr-4 font-medium text-gray-900 dark:text-gray-100'>
                    {feature}
                  </td>
                  <td className='py-2 pr-4 font-mono text-xs text-gray-600 dark:text-gray-400'>
                    {primitive}
                  </td>
                  <td className='py-2 pr-4 font-mono text-xs'>{threshold}</td>
                  <td className='py-2 text-sm text-gray-500 dark:text-gray-400'>
                    {action}
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {copy.privacyTitle}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>{copy.privacyIntro}</p>
      <ul className='text-gray-600 dark:text-gray-400'>
        {copy.privacyItems.map(([label, detail]: [string, string]) => (
          <li key={label}>
            <strong>{label}:</strong> {detail}
          </li>
        ))}
      </ul>
      <p className='text-gray-600 dark:text-gray-400'>
        {copy.privacyFooterPrefix}{' '}
        <a
          href='https://typesafe.ai/legal/privacy-policy'
          target='_blank'
          rel='noopener noreferrer'
        >
          {copy.privacyLink}
        </a>{' '}
        {copy.privacyFooterSuffix}
      </p>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {copy.furtherReadingTitle}
      </h2>
      <ul className='space-y-1 text-gray-600 dark:text-gray-400'>
        {copy.furtherReading.map(([label, href]: [string, string]) => (
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
