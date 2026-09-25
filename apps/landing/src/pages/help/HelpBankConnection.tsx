import { useLanguage } from '../../contexts/LanguageContext';
import HelpAnimation from '../../components/help/HelpAnimation';

export default function HelpBankConnection() {
  const { t } = useLanguage();

  return (
    <article className='prose prose-gray dark:prose-invert max-w-none'>
      <h1 className='mb-4 text-4xl font-bold text-gray-900 dark:text-gray-100'>
        {t.helpCenter?.bankConnection?.title}
      </h1>
      <p className='text-xl text-gray-600 dark:text-gray-400'>
        {t.helpCenter?.bankConnection?.subtitle}
      </p>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.helpCenter?.bankConnection?.howItWorksTitle}
      </h2>
      <p>{t.helpCenter?.bankConnection?.howItWorksText}</p>

      <h3>{t.helpCenter?.bankConnection?.step1Title}</h3>
      <p>{t.helpCenter?.bankConnection?.step1Text}</p>

      <h3>{t.helpCenter?.bankConnection?.step2Title}</h3>
      <p>{t.helpCenter?.bankConnection?.step2Text}</p>

      <HelpAnimation type='import' />

      <h3>{t.helpCenter?.bankConnection?.step3Title}</h3>
      <p>{t.helpCenter?.bankConnection?.step3Text}</p>

      <div className='not-prose rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20'>
        <h4 className='mb-2 flex items-center gap-2 text-blue-800 dark:text-blue-200'>
          <span>💡</span>
          {t.helpCenter?.bankConnection?.tipTitle}
        </h4>
        <p className='m-0 text-blue-700 dark:text-blue-300'>
          {t.helpCenter?.bankConnection?.tipText}
        </p>
      </div>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.helpCenter?.bankConnection?.supportedTitle}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.helpCenter?.bankConnection?.supportedText}
      </p>
    </article>
  );
}
