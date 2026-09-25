import { useLanguage } from '../../contexts/LanguageContext';
import HelpAnimation from '../../components/help/HelpAnimation';

export default function HelpFirstSteps() {
  const { t } = useLanguage();

  return (
    <article className='prose prose-gray dark:prose-invert max-w-none'>
      <h1 className='mb-4 text-4xl font-bold text-gray-900 dark:text-gray-100'>
        {t.helpCenter?.firstSteps?.title}
      </h1>
      <p className='text-xl text-gray-600 dark:text-gray-400'>
        {t.helpCenter?.firstSteps?.subtitle}
      </p>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.helpCenter?.firstSteps?.step1Title}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.helpCenter?.firstSteps?.step1Text}
      </p>

      <HelpAnimation type='profile' />

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.helpCenter?.firstSteps?.step2Title}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.helpCenter?.firstSteps?.step2Text}
      </p>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.helpCenter?.firstSteps?.step3Title}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.helpCenter?.firstSteps?.step3Text}
      </p>

      <HelpAnimation type='import' />

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.helpCenter?.firstSteps?.step4Title}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.helpCenter?.firstSteps?.step4Text}
      </p>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.helpCenter?.firstSteps?.step5Title}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.helpCenter?.firstSteps?.step5Text}
      </p>

      <div className='not-prose mt-8 rounded-lg border border-purple-200 bg-purple-50 p-6 dark:border-purple-800 dark:bg-purple-900/20'>
        <h3 className='mb-3 text-lg font-semibold text-purple-800 dark:text-purple-200'>
          {t.helpCenter?.firstSteps?.nextStepsTitle}
        </h3>
        <ul className='mb-0 list-inside list-disc text-purple-700 dark:text-purple-300'>
          <li className='mb-2'>{t.helpCenter?.firstSteps?.next1}</li>
          <li className='mb-2'>{t.helpCenter?.firstSteps?.next2}</li>
          <li className='mb-2'>{t.helpCenter?.firstSteps?.next3}</li>
          <li>{t.helpCenter?.firstSteps?.next4}</li>
        </ul>
      </div>
    </article>
  );
}
