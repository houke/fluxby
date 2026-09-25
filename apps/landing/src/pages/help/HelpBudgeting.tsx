import { useLanguage } from '../../contexts/LanguageContext';
import HelpAnimation from '../../components/help/HelpAnimation';

export default function HelpBudgeting() {
  const { t } = useLanguage();

  return (
    <article className='prose prose-gray dark:prose-invert max-w-none'>
      <h1 className='mb-4 text-4xl font-bold text-gray-900 dark:text-gray-100'>
        {t.helpCenter?.budgeting?.title}
      </h1>
      <p className='text-xl text-gray-600 dark:text-gray-400'>
        {t.helpCenter?.budgeting?.subtitle}
      </p>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.helpCenter?.budgeting?.whatIsTitle}
      </h2>
      <p>{t.helpCenter?.budgeting?.whatIsText}</p>

      <HelpAnimation type='budget' />

      <h2>{t.helpCenter?.budgeting?.createTitle}</h2>
      <ol>
        <li>{t.helpCenter?.budgeting?.step1}</li>
        <li>{t.helpCenter?.budgeting?.step2}</li>
        <li>{t.helpCenter?.budgeting?.step3}</li>
        <li>{t.helpCenter?.budgeting?.step4}</li>
        <li>{t.helpCenter?.budgeting?.step5}</li>
      </ol>

      <div className='not-prose rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20'>
        <h4 className='mb-2 flex items-center gap-2 text-green-800 dark:text-green-200'>
          <span>✅</span>
          {t.helpCenter?.budgeting?.bestPracticeTitle}
        </h4>
        <p className='m-0 text-green-700 dark:text-green-300'>
          {t.helpCenter?.budgeting?.bestPracticeText}
        </p>
      </div>

      <h2>{t.helpCenter?.budgeting?.trackingTitle}</h2>
      <p>{t.helpCenter?.budgeting?.trackingText}</p>

      <h2>{t.helpCenter?.budgeting?.suggestedTitle}</h2>
      <p>{t.helpCenter?.budgeting?.suggestedText}</p>
    </article>
  );
}
