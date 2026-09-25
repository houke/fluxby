import { useLanguage } from '../../contexts/LanguageContext';
import HelpAnimation from '../../components/help/HelpAnimation';

export default function HelpSubscriptions() {
  const { t } = useLanguage();

  return (
    <article className='prose prose-gray dark:prose-invert max-w-none'>
      <h1 className='mb-4 text-4xl font-bold text-gray-900 dark:text-gray-100'>
        {t.helpCenter?.subscriptions?.title}
      </h1>
      <p className='text-xl text-gray-600 dark:text-gray-400'>
        {t.helpCenter?.subscriptions?.subtitle}
      </p>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.helpCenter?.subscriptions?.whatIsTitle}
      </h2>
      <p>{t.helpCenter?.subscriptions?.whatIsText}</p>

      <HelpAnimation type='subscriptions' />

      <h2>{t.helpCenter?.subscriptions?.detectionTitle}</h2>
      <p>{t.helpCenter?.subscriptions?.detectionText}</p>
      <h2>{t.helpCenter?.subscriptions?.jevReviewTitle}</h2>
      <p>{t.helpCenter?.subscriptions?.jevReviewText}</p>
      <ol>
        <li>{t.helpCenter?.subscriptions?.step1}</li>
        <li>{t.helpCenter?.subscriptions?.step2}</li>
        <li>{t.helpCenter?.subscriptions?.step3}</li>
        <li>{t.helpCenter?.subscriptions?.step4}</li>
      </ol>

      <h2>{t.helpCenter?.subscriptions?.confirmTitle}</h2>
      <p>{t.helpCenter?.subscriptions?.confirmText}</p>
      <ul>
        <li>
          <strong>{t.helpCenter?.subscriptions?.confirmButton}</strong>:{' '}
          {t.helpCenter?.subscriptions?.confirmButtonText}
        </li>
        <li>
          <strong>{t.helpCenter?.subscriptions?.dismissButton}</strong>:{' '}
          {t.helpCenter?.subscriptions?.dismissButtonText}
        </li>
      </ul>

      <div className='not-prose rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20'>
        <h4 className='mb-2 flex items-center gap-2 text-amber-800 dark:text-amber-200'>
          <span>💡</span>
          {t.helpCenter?.subscriptions?.tipTitle}
        </h4>
        <p className='m-0 text-amber-700 dark:text-amber-300'>
          {t.helpCenter?.subscriptions?.tipText}
        </p>
      </div>

      <h2>{t.helpCenter?.subscriptions?.priceAlertsTitle}</h2>
      <p>{t.helpCenter?.subscriptions?.priceAlertsText}</p>

      <h3>{t.helpCenter?.subscriptions?.priceIncreaseTitle}</h3>
      <p>{t.helpCenter?.subscriptions?.priceIncreaseText}</p>

      <h3>{t.helpCenter?.subscriptions?.priceDecreaseTitle}</h3>
      <p>{t.helpCenter?.subscriptions?.priceDecreaseText}</p>

      <h2>{t.helpCenter?.subscriptions?.monthlyOverviewTitle}</h2>
      <p>{t.helpCenter?.subscriptions?.monthlyOverviewText}</p>

      <h2>{t.helpCenter?.subscriptions?.viewsTitle}</h2>
      <p>{t.helpCenter?.subscriptions?.viewsText}</p>

      <div className='not-prose rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20'>
        <h4 className='mb-2 flex items-center gap-2 text-green-800 dark:text-green-200'>
          <span>✅</span>
          {t.helpCenter?.subscriptions?.bestPracticeTitle}
        </h4>
        <p className='m-0 text-green-700 dark:text-green-300'>
          {t.helpCenter?.subscriptions?.bestPracticeText}
        </p>
      </div>
    </article>
  );
}
