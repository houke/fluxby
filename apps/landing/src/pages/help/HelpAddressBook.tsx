import { useLanguage } from '../../contexts/LanguageContext';
import HelpAnimation from '../../components/help/HelpAnimation';

export default function HelpAddressBook() {
  const { t } = useLanguage();

  return (
    <article className='prose prose-gray dark:prose-invert max-w-none'>
      <h1 className='mb-4 text-4xl font-bold text-gray-900 dark:text-gray-100'>
        {t.helpCenter?.addressBook?.title}
      </h1>
      <p className='text-xl text-gray-600 dark:text-gray-400'>
        {t.helpCenter?.addressBook?.subtitle}
      </p>

      <div className='mt-8 rounded-xl border border-purple-200 bg-purple-50 p-6 dark:border-purple-800 dark:bg-purple-950/30'>
        <h3 className='mt-0 mb-2 flex items-center gap-2 text-lg font-semibold text-purple-900 dark:text-purple-200'>
          <span>💡</span>
          {t.helpCenter?.addressBook?.tipTitle}
        </h3>
        <p className='mb-0 text-purple-800 dark:text-purple-300'>
          {t.helpCenter?.addressBook?.tipText}
        </p>
      </div>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.helpCenter?.addressBook?.whatAreTitle}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.helpCenter?.addressBook?.whatAreText}
      </p>

      <HelpAnimation type='addressBook' />

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.helpCenter?.addressBook?.featuresTitle}
      </h2>

      <h3 className='mt-8 text-xl font-semibold text-gray-900 dark:text-gray-100'>
        {t.helpCenter?.addressBook?.autoExtractionTitle}
      </h3>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.helpCenter?.addressBook?.autoExtractionText}
      </p>

      <h3 className='mt-8 text-xl font-semibold text-gray-900 dark:text-gray-100'>
        {t.helpCenter?.addressBook?.nameCleanupTitle}
      </h3>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.helpCenter?.addressBook?.nameCleanupText}
      </p>

      <h3 className='mt-8 text-xl font-semibold text-gray-900 dark:text-gray-100'>
        {t.helpCenter?.addressBook?.sharedIbansTitle}
      </h3>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.helpCenter?.addressBook?.sharedIbansText}
      </p>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.helpCenter?.addressBook?.managingTitle}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.helpCenter?.addressBook?.managingText}
      </p>
      <ul className='mt-4 list-inside list-disc text-gray-600 dark:text-gray-400'>
        <li>{t.helpCenter?.addressBook?.manage1}</li>
        <li>{t.helpCenter?.addressBook?.manage2}</li>
        <li>{t.helpCenter?.addressBook?.manage3}</li>
        <li>{t.helpCenter?.addressBook?.manage4}</li>
      </ul>
    </article>
  );
}
