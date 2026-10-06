import { useLanguage } from '../contexts/LanguageContext';

export default function PageLoading() {
  const { t } = useLanguage();
  return (
    <div
      role='status'
      className='flex min-h-40 items-center justify-center text-gray-500 dark:text-gray-400'
    >
      {t.helpCenter.common.loading}
    </div>
  );
}
