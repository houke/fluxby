/**
 * QR Code Pairing Component
 * Shows QR code for easy device pairing
 */
import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Check, RefreshCw, QrCode, Smartphone } from 'lucide-react';
import { useSync } from '@/contexts/SyncContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface QRPairingDialogProps {
  trigger?: React.ReactNode;
}

export function QRPairingDialog({ trigger }: QRPairingDialogProps) {
  const { t } = useLanguage();
  const { pairingCode, generateNewPairingCode, isInitialized, deviceName } =
    useSync();

  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Generate pairing code when dialog opens
  useEffect(() => {
    if (isOpen && !pairingCode && isInitialized) {
      generateNewPairingCode();
    }
  }, [isOpen, pairingCode, isInitialized, generateNewPairingCode]);

  const handleCopy = async () => {
    if (pairingCode) {
      await navigator.clipboard.writeText(pairingCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRefresh = () => {
    generateNewPairingCode();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant='outline' disabled={!isInitialized}>
            <QrCode className='mr-2 h-4 w-4' />
            {t.settings?.sync?.showQRCode || 'Show QR code'}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Smartphone className='h-5 w-5' />
            {t.settings?.sync?.pairDevice || 'Pair a device'}
          </DialogTitle>
          <DialogDescription>
            {t.settings?.sync?.qrCodeDescription ||
              'Scan this QR code with another device running Fluxby to sync your data.'}
          </DialogDescription>
        </DialogHeader>

        <div className='flex flex-col items-center space-y-4 py-4'>
          {/* QR Code */}
          <div className='rounded-xl bg-white p-4 shadow-inner'>
            {pairingCode ? (
              <QRCodeSVG
                value={pairingCode}
                size={200}
                level='M'
                includeMargin={false}
                bgColor='#ffffff'
                fgColor='#000000'
              />
            ) : (
              <div className='flex h-[200px] w-[200px] items-center justify-center bg-gray-100'>
                <RefreshCw className='h-8 w-8 animate-spin text-muted-foreground' />
              </div>
            )}
          </div>

          {/* Device Name */}
          <div className='text-center'>
            <Badge variant='secondary' className='text-sm'>
              {deviceName}
            </Badge>
          </div>

          {/* Manual Code */}
          <div className='w-full space-y-2'>
            <p className='text-center text-sm text-muted-foreground'>
              {t.settings?.sync?.orEnterManually ||
                'Or enter this code manually:'}
            </p>
            <div className='flex items-center justify-center gap-2'>
              <code
                className={cn(
                  'rounded-lg bg-muted px-4 py-2 font-mono text-lg tracking-widest',
                  'select-all'
                )}
              >
                {pairingCode || '------'}
              </code>
              <Button
                variant='ghost'
                size='icon'
                onClick={handleCopy}
                disabled={!pairingCode}
              >
                {copied ? (
                  <Check className='h-4 w-4 text-green-500' />
                ) : (
                  <Copy className='h-4 w-4' />
                )}
              </Button>
            </div>
          </div>

          {/* Actions */}
          <div className='flex gap-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={handleRefresh}
              disabled={!isInitialized}
            >
              <RefreshCw className='mr-2 h-3 w-3' />
              {t.settings?.sync?.newCode || 'New code'}
            </Button>
          </div>

          {/* Help Text */}
          <p className='text-center text-xs text-muted-foreground'>
            {t.settings?.sync?.qrCodeValid ||
              'This code remains valid until you generate a new one.'}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
