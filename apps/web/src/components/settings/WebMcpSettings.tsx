import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import { useWebMcp } from '@/contexts/WebMcpContext';
import { usePrivacy } from '@/contexts/PrivacyContext';
import { getWebMcpModelContext } from '@/lib/webmcp-tools';

export function WebMcpSettings() {
  const { t } = useLanguage();
  const { enabled, setEnabled } = useWebMcp();
  const { isPrivacyMode } = usePrivacy();
  const toast = useToast();
  const supported = Boolean(getWebMcpModelContext());
  const helpHref = new URL(
    '../help/webmcp',
    new URL(import.meta.env.BASE_URL, window.location.origin)
  ).toString();

  return (
    <Card
      className='rounded-none border-x-0 shadow-none sm:rounded-2xl sm:border-x sm:shadow-sm'
      data-onboarding='settings-webmcp'
    >
      <CardHeader>
        <CardTitle className='text-base sm:text-lg'>
          {t.webMcp.settingsTitle}
        </CardTitle>
        <CardDescription>{t.webMcp.settingsDescription}</CardDescription>
      </CardHeader>
      <CardContent className='space-y-3'>
        <p className='text-sm text-muted-foreground' role='status'>
          {!supported
            ? t.webMcp.unsupported
            : isPrivacyMode
              ? t.webMcp.privacyUnavailable
              : enabled
                ? t.webMcp.active
                : t.webMcp.inactive}
        </p>
        <div className='flex flex-wrap items-center gap-3'>
          <Button
            type='button'
            disabled={!supported || isPrivacyMode}
            onClick={() => {
              setEnabled(!enabled);
              toast.info(enabled ? t.webMcp.inactive : t.webMcp.active);
            }}
          >
            {enabled ? t.webMcp.disable : t.webMcp.enable}
          </Button>
          <a
            href={helpHref}
            className='text-sm text-purple-600 underline dark:text-purple-400'
          >
            {t.webMcp.helpLink}
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
