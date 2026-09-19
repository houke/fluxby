import { useState } from 'react';
import { ExternalLink, KeyRound, Sparkles, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import { useOPFSSetting } from '@/hooks/useOPFSSetting';

export function TypeSafeSettings() {
  const { t } = useLanguage();
  const toast = useToast();
  const s = t.settings.typesafeAi;

  const [storedKey, setStoredKey, clearKey] = useOPFSSetting<string>(
    'typesafe-api-key',
    ''
  );
  const [editValue, setEditValue] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [showKey, setShowKey] = useState(false);

  const hasKey = !!storedKey;

  const handleStartEdit = () => {
    setEditValue('');
    setIsEditing(true);
    setShowKey(false);
  };

  const handleSave = async () => {
    const trimmed = editValue.trim();
    if (!trimmed) return;
    await setStoredKey(trimmed);
    setIsEditing(false);
    setEditValue('');
    toast.success(s.keySaved);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditValue('');
  };

  const handleRemove = async () => {
    await clearKey();
    toast.info(s.keyRemoved);
  };

  return (
    <Card className='rounded-none border-x-0 shadow-none sm:rounded-2xl sm:border-x sm:shadow-sm'>
      <CardHeader className='px-3 py-3 sm:px-6 sm:py-4'>
        <div className='flex items-start gap-3'>
          <Sparkles className='mt-0.5 h-5 w-5 shrink-0 text-purple-500' />
          <div>
            <CardTitle className='text-base sm:text-lg'>{s.title}</CardTitle>
            <CardDescription className='text-xs sm:text-sm'>
              {s.description}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className='px-3 pb-3 pt-0 sm:px-6 sm:pb-6'>
        <div className='space-y-4'>
          {/* Explanation */}
          <p className='text-muted-foreground text-sm'>{s.whatIsTypeSafe}</p>

          {/* API key row */}
          <div className='space-y-2'>
            <label className='text-sm font-medium'>{s.apiKeyLabel}</label>

            {isEditing ? (
              <div className='flex gap-2'>
                <Input
                  type={showKey ? 'text' : 'password'}
                  placeholder={s.apiKeyPlaceholder}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSave();
                    if (e.key === 'Escape') handleCancel();
                  }}
                  autoFocus
                  className='font-mono text-sm'
                />
                <Button
                  variant='ghost'
                  size='icon'
                  className='rounded-md hover:bg-green-600 hover:text-white'
                  onClick={handleSave}
                  disabled={!editValue.trim()}
                >
                  <Check className='h-4 w-4' />
                </Button>
                <Button
                  variant='ghost'
                  size='icon'
                  className='rounded-md hover:bg-red-600 hover:text-white'
                  onClick={handleCancel}
                >
                  <X className='h-4 w-4' />
                </Button>
              </div>
            ) : (
              <div className='flex items-center gap-2'>
                {hasKey ? (
                  <>
                    <div className='flex flex-1 items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 text-sm font-mono'>
                      <KeyRound className='h-3.5 w-3.5 shrink-0 text-green-500' />
                      <span className='text-muted-foreground'>
                        {showKey
                          ? storedKey
                          : '••••••••••••••••••••••••••••••••'}
                      </span>
                    </div>
                    <Button
                      variant='ghost'
                      size='sm'
                      className='shrink-0 text-xs'
                      onClick={() => setShowKey((v) => !v)}
                    >
                      {showKey ? s.hideKey : s.showKey}
                    </Button>
                    <Button
                      variant='ghost'
                      size='sm'
                      className='shrink-0 rounded-md hover:bg-purple-600 hover:text-white'
                      onClick={handleStartEdit}
                    >
                      {s.changeKey}
                    </Button>
                    <Button
                      variant='ghost'
                      size='sm'
                      className='shrink-0 rounded-md hover:bg-red-600 hover:text-white'
                      onClick={handleRemove}
                    >
                      {s.removeKey}
                    </Button>
                  </>
                ) : (
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={handleStartEdit}
                    className='gap-2'
                  >
                    <KeyRound className='h-4 w-4' />
                    {s.addKey}
                  </Button>
                )}
              </div>
            )}

            {/* Get key link */}
            <a
              href='https://console.typesafe.ai/keys'
              target='_blank'
              rel='noopener noreferrer'
              className='inline-flex items-center gap-1 text-xs text-purple-500 hover:underline'
            >
              <ExternalLink className='h-3 w-3' />
              {s.getKeyLink}
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
