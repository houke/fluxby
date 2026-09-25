import { ExternalLink, Sparkles } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

export default function HelpAI() {
  const { t } = useLanguage();
  const copy = t.helpCenter.ai;

  return (
    <article className='prose prose-gray dark:prose-invert max-w-none'>
      <h1 className='mb-4 text-4xl font-bold text-gray-900 dark:text-gray-100'>
        {copy.title}
      </h1>
      <p className='text-xl text-gray-600 dark:text-gray-400'>{copy.intro}</p>

      <div className='not-prose mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-200'>
        {copy.notice}
      </div>

      <div className='not-prose mt-8 rounded-xl border border-purple-200 bg-purple-50 p-6 dark:border-purple-800 dark:bg-purple-950/30'>
        <h3 className='mt-0 mb-2 flex items-center gap-2 text-lg font-semibold text-purple-900 dark:text-purple-200'>
          <Sparkles className='h-5 w-5' />
          {copy.whatTitle}
        </h3>
        <p className='mb-2 text-purple-800 dark:text-purple-300'>
          {copy.whatText}
        </p>
        <p className='mb-0 text-purple-800 dark:text-purple-300'>
          <strong>{copy.optionalTitle}</strong> {copy.optionalText}
        </p>
      </div>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {copy.benefitsTitle}
      </h2>
      <div className='not-prose mt-6 grid gap-4 md:grid-cols-2'>
        {copy.features.map(
          (item: { emoji: string; title: string; description: string }) => (
            <div
              key={item.title}
              className='rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800/50'
            >
              <div className='mb-2 text-2xl'>{item.emoji}</div>
              <h4 className='font-semibold text-gray-900 dark:text-gray-100'>
                {item.title}
              </h4>
              <p className='mt-1 text-sm text-gray-500 dark:text-gray-400'>
                {item.description}
              </p>
            </div>
          )
        )}
      </div>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {copy.setupTitle}
      </h2>
      <ol className='text-gray-600 dark:text-gray-400'>
        <li>{copy.setupSteps[0]}</li>
        <li>
          {copy.setupKeyPrefix}{' '}
          <a
            href='https://console.typesafe.ai/keys'
            target='_blank'
            rel='noopener noreferrer'
            className='inline-flex items-center gap-1'
          >
            {copy.setupKeyLabel}
            <ExternalLink className='h-3 w-3' />
          </a>
        </li>
        <li>{copy.setupSteps[1]}</li>
        <li>{copy.setupSteps[2]}</li>
      </ol>
      <p className='text-gray-600 dark:text-gray-400'>{copy.removeKeyNotice}</p>
      <p className='text-gray-600 dark:text-gray-400'>{copy.demoDataNotice}</p>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {copy.privacyTitle}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>{copy.privacyText}</p>
      <div className='not-prose mt-4 overflow-x-auto rounded-lg border'>
        <table className='w-full border-collapse text-sm'>
          <thead className='bg-gray-50 dark:bg-gray-800'>
            <tr>
              <th className='px-4 py-2 text-left font-medium'>
                {copy.dataTableFeature}
              </th>
              <th className='px-4 py-2 text-left font-medium'>
                {copy.dataTableSent}
              </th>
            </tr>
          </thead>
          <tbody className='divide-y'>
            {copy.dataRows.map(([feature, data]: [string, string]) => (
              <tr key={feature}>
                <td className='px-4 py-2 font-medium'>{feature}</td>
                <td className='px-4 py-2 text-gray-500 dark:text-gray-400'>
                  {data}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className='text-gray-600 dark:text-gray-400'>
        {copy.privacyLinkPrefix}{' '}
        <a
          href='https://typesafe.ai/legal/privacy-policy'
          target='_blank'
          rel='noopener noreferrer'
          className='inline-flex items-center gap-1'
        >
          {copy.privacyLinkLabel}
          <ExternalLink className='h-3 w-3' />
        </a>{' '}
        {copy.privacyLinkSuffix}
      </p>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {copy.faqTitle}
      </h2>
      {copy.faqs.map(
        (faq: {
          question: string;
          answer?: string;
          answerPrefix?: string;
          linkLabel?: string;
          answerSuffix?: string;
        }) => (
          <section key={faq.question}>
            <h3 className='mt-6 text-lg font-semibold text-gray-900 dark:text-gray-100'>
              {faq.question}
            </h3>
            <p className='text-gray-600 dark:text-gray-400'>
              {faq.answer}
              {faq.answerPrefix && (
                <>
                  {faq.answerPrefix}{' '}
                  <a
                    href='https://typesafe.ai'
                    target='_blank'
                    rel='noopener noreferrer'
                    className='inline-flex items-center gap-1'
                  >
                    {faq.linkLabel}
                    <ExternalLink className='h-3 w-3' />
                  </a>{' '}
                  {faq.answerSuffix}
                </>
              )}
            </p>
          </section>
        )
      )}
    </article>
  );
}
