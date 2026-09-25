import { ExternalLink } from 'lucide-react';
import CodeBlock from '../../components/docs/CodeBlock';
import { useLanguage } from '../../contexts/LanguageContext';

interface CategoryExampleCopy {
  merchant: string;
  description: string;
  category: string;
  instructions: string;
  restaurants: string;
  transport: string;
  noCategory: string;
}

interface ClientExampleCopy {
  merchant: string;
  description: string;
  keyComment: string;
  fallbackComment: string;
  writeComment: string;
}

interface DirectionExampleCopy {
  beforeLoopComment: string;
  batchComment: string;
  debitInstruction: string;
  debitMeaning: string;
  creditInstruction: string;
  creditMeaning: string;
  unknownMeaning: string;
}

const exampleRequest = (copy: CategoryExampleCopy) => {
  const [groceriesId, restaurantsId, transportId] = [
    'cat-uuid-1',
    'cat-uuid-2',
    'cat-uuid-3',
  ];

  return JSON.stringify(
    {
      state: {
        merchant: copy.merchant,
        description: copy.description,
        amount: -24.8,
      },
      model: 'jev-latest',
      questions: {
        category: {
          type: 'choice',
          instructions: copy.instructions,
          criteria: {
            [groceriesId]: copy.category,
            [restaurantsId]: copy.restaurants,
            [transportId]: copy.transport,
            none: copy.noCategory,
          },
        },
      },
    },
    null,
    2
  );
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

const directionExample = (copy: DirectionExampleCopy) => {
  const payload = {
    state: { directionValues: ['Belastung', 'Gutschrift'] },
    model: 'jev-latest',
    questions: {
      v0: {
        type: 'choice',
        instructions: copy.debitInstruction,
        criteria: {
          debit: copy.debitMeaning,
          credit: copy.creditMeaning,
          unknown: copy.unknownMeaning,
        },
      },
      v1: {
        type: 'choice',
        instructions: copy.creditInstruction,
        criteria: {
          debit: copy.debitMeaning,
          credit: copy.creditMeaning,
          unknown: copy.unknownMeaning,
        },
      },
    },
  };

  return `${copy.beforeLoopComment}\n${copy.batchComment}\n\n${JSON.stringify(payload, null, 2)}`;
};

const clientExample = (copy: ClientExampleCopy) => {
  return `import {
  suggestCategory,
  detectDirectionConvention,
  detectDateFormat,
  detectIsPaymentProvider,
  getTypeSafeApiKey,
} from '@/lib/typesafe-client';

${copy.keyComment}
const key = getTypeSafeApiKey();
if (!key) return; // ${copy.fallbackComment}

const suggestion = await suggestCategory({
  merchantName: '${copy.merchant}',
  description: '${copy.description}',
  amount: -24.80,
  categories: userCategories,   // user's own category list
  apiKey: key,
});

if (suggestion && suggestion.confidence > 0.7) {
  // ${copy.writeComment}
  await db.runAsync(
    'UPDATE transactions SET category_id = ? WHERE id = ?',
    [suggestion.categoryId, transactionId]
  );
}`;
};

export default function DocsAI() {
  const { t } = useLanguage();
  const docs = t.docs.ai;
  const examples = docs.examples;

  return (
    <article className='prose prose-gray dark:prose-invert max-w-none'>
      <h1 className='mb-4 text-4xl font-bold text-gray-900 dark:text-gray-100'>
        {docs.title}
      </h1>
      <p className='text-xl text-gray-600 dark:text-gray-400'>
        {docs.subtitle}
      </p>

      <div className='mt-8 rounded-xl border border-purple-200 bg-purple-50 p-6 dark:border-purple-800 dark:bg-purple-950/30'>
        <h3 className='mt-0 mb-2 flex items-center gap-2 text-lg font-semibold text-purple-900 dark:text-purple-200'>
          <span>✨</span> {docs.whatTitle}
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
          {docs.whatText}
        </p>
        <p className='mb-0 text-purple-800 dark:text-purple-300'>
          {docs.controlText}
        </p>
      </div>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {docs.architectureTitle}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {docs.architectureIntro}
      </p>
      <div className='not-prose mt-6 overflow-x-auto'>
        <table className='w-full border-collapse text-sm'>
          <thead>
            <tr className='border-b text-left'>
              {docs.decisionHeaders.map((header: string) => (
                <th key={header} className='py-2 pr-4 font-medium'>
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {docs.decisions.map(
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
        {docs.optInTitle}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>{docs.optInText}</p>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {docs.implementationTitle}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {docs.implementationText}
      </p>
      <p className='text-gray-600 dark:text-gray-400'>{docs.workerText}</p>
      <CodeBlock language='typescript' code={clientExample(examples.client)} />

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {docs.categoryExampleTitle}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {docs.categoryExampleText}
      </p>
      <h3 className='mt-6 text-lg font-semibold text-gray-900 dark:text-gray-100'>
        {docs.request}
      </h3>
      <CodeBlock language='json' code={exampleRequest(examples.request)} />
      <h3 className='mt-6 text-lg font-semibold text-gray-900 dark:text-gray-100'>
        {docs.response}
      </h3>
      <CodeBlock language='json' code={exampleResponse} />
      <p className='text-gray-600 dark:text-gray-400'>{docs.confidenceText}</p>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {docs.directionExampleTitle}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>{docs.directionText}</p>
      <CodeBlock language='json' code={directionExample(examples.direction)} />

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {docs.thresholdsTitle}
      </h2>
      <div className='not-prose mt-4 overflow-x-auto'>
        <table className='w-full border-collapse text-sm'>
          <thead>
            <tr className='border-b text-left'>
              {docs.thresholdHeaders.map((header: string) => (
                <th key={header} className='py-2 pr-4 font-medium'>
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {docs.thresholds.map(
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
        {docs.privacyTitle}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>{docs.privacyIntro}</p>
      <ul className='text-gray-600 dark:text-gray-400'>
        {docs.privacyItems.map(([label, detail]: [string, string]) => (
          <li key={label}>
            <strong>{label}:</strong> {detail}
          </li>
        ))}
      </ul>
      <p className='text-gray-600 dark:text-gray-400'>
        {docs.privacyFooterPrefix}{' '}
        <a
          href='https://typesafe.ai/legal/privacy-policy'
          target='_blank'
          rel='noopener noreferrer'
        >
          {docs.privacyLink}
        </a>{' '}
        {docs.privacyFooterSuffix}
      </p>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {docs.furtherReadingTitle}
      </h2>
      <ul className='space-y-1 text-gray-600 dark:text-gray-400'>
        {docs.furtherReading.map(([label, href]: [string, string]) => (
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
