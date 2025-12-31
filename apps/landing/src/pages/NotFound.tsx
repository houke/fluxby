import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, FileQuestion } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export default function NotFound() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  // Check if there's history to go back to
  const canGoBack = window.history.length > 1;

  const handleGoBack = () => {
    if (canGoBack) {
      window.history.back();
    } else {
      navigate('/');
    }
  };

  return (
    <div className='flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900'>
      <div className='mx-4 w-full max-w-md rounded-lg border border-gray-200 bg-white p-8 shadow-lg dark:border-gray-700 dark:bg-gray-800'>
        <div className='flex flex-col items-center text-center'>
          {/* Icon */}
          <div className='mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30'>
            <FileQuestion className='h-8 w-8 text-purple-600 dark:text-purple-400' />
          </div>

          {/* Title */}
          <h2 className='mb-2 text-xl font-semibold text-gray-900 dark:text-white'>
            {t.errors?.notFound || 'Pagina niet gevonden'}
          </h2>

          {/* Description */}
          <p className='mb-6 text-gray-600 dark:text-gray-400'>
            {t.errors?.notFoundDescription ||
              'De pagina die je zoekt bestaat niet of is verplaatst.'}
          </p>

          {/* Buttons */}
          <div className='flex w-full flex-col gap-3'>
            <button
              onClick={() => navigate('/')}
              className='flex w-full items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 py-3 font-medium text-white transition-colors hover:bg-purple-700'
            >
              <Home className='h-4 w-4' />
              {t.errors?.goHome || 'Naar homepage'}
            </button>
            <button
              onClick={handleGoBack}
              className='flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
            >
              <ArrowLeft className='h-4 w-4' />
              {t.errors?.goBack || 'Ga terug'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
