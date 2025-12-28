import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, FileQuestion } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

export default function NotFound() {
  const navigate = useNavigate();
  const { language } = useLanguage();

  return (
    <div className='flex min-h-[80vh] items-center justify-center'>
      <div className='mx-4 w-full max-w-md rounded-lg border bg-card p-8 shadow-lg'>
        <div className='flex flex-col items-center text-center'>
          {/* Icon */}
          <div className='mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30'>
            <FileQuestion className='h-8 w-8 text-purple-600 dark:text-purple-400' />
          </div>

          {/* Title */}
          <h2 className='mb-2 text-xl font-semibold'>
            {language === 'nl' ? 'Pagina niet gevonden' : 'Page not found'}
          </h2>

          {/* Description */}
          <p className='mb-6 text-muted-foreground'>
            {language === 'nl'
              ? 'De pagina die je zoekt bestaat niet of is verplaatst.'
              : "The page you're looking for doesn't exist or has been moved."}
          </p>

          {/* Buttons */}
          <div className='flex w-full flex-col gap-3'>
            <Button onClick={() => navigate('/')} className='w-full' size='lg'>
              <Home className='mr-2 h-4 w-4' />
              {language === 'nl' ? 'Naar dashboard' : 'Go to dashboard'}
            </Button>
            <Button
              variant='outline'
              onClick={() => navigate(-1)}
              className='w-full'
              size='lg'
            >
              <ArrowLeft className='mr-2 h-4 w-4' />
              {language === 'nl' ? 'Ga terug' : 'Go back'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
