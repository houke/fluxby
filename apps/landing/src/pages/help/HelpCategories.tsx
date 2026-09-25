import { useLanguage } from '../../contexts/LanguageContext';
import HelpAnimation from '../../components/help/HelpAnimation';

interface CategoryExample {
  name: string;
  description: string;
  emoji: string;
  color: string;
}

export default function HelpCategories() {
  const { t } = useLanguage();
  const examples = t.helpCenter.categories.examples as CategoryExample[];

  return (
    <article className='prose prose-gray dark:prose-invert max-w-none'>
      <h1 className='mb-4 text-4xl font-bold text-gray-900 dark:text-gray-100'>
        {t.helpCenter?.categories?.title}
      </h1>
      <p className='text-xl text-gray-600 dark:text-gray-400'>
        {t.helpCenter?.categories?.subtitle}
      </p>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.helpCenter?.categories?.whatAreTitle}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.helpCenter?.categories?.whatAreText}
      </p>

      <HelpAnimation type='categories' />

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.helpCenter?.categories?.defaultTitle}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.helpCenter?.categories?.defaultText}
      </p>
      <div className='not-prose mt-6 grid gap-3 md:grid-cols-3'>
        {examples.map((cat, idx) => (
          <div
            key={idx}
            className='flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800'
          >
            <div
              className='flex h-10 w-10 items-center justify-center rounded-lg text-xl'
              style={{ backgroundColor: `${cat.color}20` }}
            >
              {cat.emoji}
            </div>
            <div className='min-w-0 flex-1'>
              <span className='block text-sm font-medium text-gray-900 dark:text-gray-100'>
                {cat.name}
              </span>
              <span className='block truncate text-xs text-gray-500 dark:text-gray-400'>
                {cat.description}
              </span>
            </div>
          </div>
        ))}
      </div>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.helpCenter?.categories?.createTitle}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.helpCenter?.categories?.createText}
      </p>
      <ol className='mt-4 list-inside list-decimal text-gray-600 dark:text-gray-400'>
        <li className='mb-2'>{t.helpCenter?.categories?.step1}</li>
        <li className='mb-2'>{t.helpCenter?.categories?.step2}</li>
        <li className='mb-2'>{t.helpCenter?.categories?.step3}</li>
        <li className='mb-2'>{t.helpCenter?.categories?.step4}</li>
        <li>{t.helpCenter?.categories?.step5}</li>
      </ol>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.helpCenter?.categories?.subcategoryTitle}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.helpCenter?.categories?.subcategoryText}
      </p>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.helpCenter?.categories?.rulesTitle}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.helpCenter?.categories?.rulesText}
      </p>

      <div className='not-prose mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20'>
        <h4 className='mb-2 flex items-center gap-2 text-blue-800 dark:text-blue-200'>
          <span>💡</span>
          {t.helpCenter?.categories?.tipTitle}
        </h4>
        <p className='m-0 text-blue-700 dark:text-blue-300'>
          {t.helpCenter?.categories?.tipText}
        </p>
      </div>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.helpCenter?.categories?.deleteTitle}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.helpCenter?.categories?.deleteText}
      </p>
    </article>
  );
}
