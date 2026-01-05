/**
 * Sync Settings Component
 * UI for peer-to-peer device syncing
 */
import { useState, useRef } from 'react';
import {
  Smartphone,
  Laptop,
  RefreshCw,
  Copy,
  Check,
  Trash2,
  Wifi,
  WifiOff,
  QrCode,
  Link,
  Lock,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useSync } from '@/contexts/SyncContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { SyncDebugPanel } from './SyncDebugPanel';

export function SyncSettings() {
  const { t } = useLanguage();
  const {
    deviceId,
    deviceName,
    setDeviceName,
    isInitialized,
    pairingCode,
    generateNewPairingCode,
    connectWithPairingCode,
    pairedDevices,
    pendingPairingRequest,
    disconnectDevice,
    lastError,
    retryInitialization,
  } = useSync();

  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(deviceName);
  const [pairingInput, setPairingInput] = useState('');
  const [isPairingDialogOpen, setIsPairingDialogOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [showDebugPanel, setShowDebugPanel] = useState(false);

  // Triple-click detection for debug panel
  const clickCountRef = useRef(0);
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTitleClick = () => {
    clickCountRef.current += 1;

    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
    }

    if (clickCountRef.current === 3) {
      setShowDebugPanel(!showDebugPanel);
      clickCountRef.current = 0;
    } else {
      clickTimerRef.current = setTimeout(() => {
        clickCountRef.current = 0;
      }, 500);
    }
  };

  // Handle device name save
  const handleSaveName = () => {
    if (editedName.trim()) {
      setDeviceName(editedName.trim());
    }
    setIsEditing(false);
  };

  // Handle pairing code copy
  const handleCopyCode = async () => {
    if (pairingCode) {
      await navigator.clipboard.writeText(pairingCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  // Handle connect with code
  const handleConnect = async () => {
    if (!pairingInput.trim()) return;

    setIsConnecting(true);
    setConnectionError(null); // Clear previous errors

    try {
      const success = await connectWithPairingCode(pairingInput.trim());

      if (!success) {
        // Error is set in SyncContext and we can use it, but for the modal let's be specific
        setConnectionError(
          t.settings?.sync?.connectionFailed || 'Connection failed'
        );
      } else {
        setPairingInput('');
        setIsPairingDialogOpen(false);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      if (errorMessage === 'cannot-connect-to-self') {
        setConnectionError(
          t.settings?.sync?.cannotConnectToSelf || 'Cannot connect to yourself'
        );
      } else if (errorMessage === 'peer-unavailable') {
        setConnectionError(
          t.settings?.sync?.peerUnavailable || 'Peer unavailable'
        );
      } else {
        setConnectionError(errorMessage || 'Connection failed');
      }
    } finally {
      setIsConnecting(false);
    }
  };

  // Format device icon
  const getDeviceIcon = (name: string) => {
    if (
      name.toLowerCase().includes('mobile') ||
      name.toLowerCase().includes('phone')
    ) {
      return <Smartphone className='h-4 w-4' />;
    }
    return <Laptop className='h-4 w-4' />;
  };

  return (
    <div className='-mx-3 sm:mx-0'>
      <Card className='rounded-none border-x-0 shadow-none sm:rounded-2xl sm:border-x sm:shadow-sm'>
        <CardHeader className='px-3 py-3 sm:px-6 sm:py-4'>
          <CardTitle
            className='flex cursor-default select-none items-center gap-2 text-base sm:text-lg'
            onClick={handleTitleClick}
          >
            {t.settings?.sync?.title || 'Device sync'}
            <Badge variant='secondary'>
              {t.settings?.sync?.inDevelopment || 'In development'}
            </Badge>
          </CardTitle>
          <CardDescription className='text-xs sm:text-sm'>
            {t.settings?.sync?.description ||
              'Sync your data across devices using peer-to-peer connections. No server required.'}
          </CardDescription>
        </CardHeader>
        <CardContent className='relative px-3 pb-3 pt-0 sm:px-6 sm:pb-6 sm:pt-0'>
          {/* Coming Soon Overlay */}
          <div className='absolute inset-0 z-10 flex flex-col items-center justify-center rounded-b-lg bg-white/80 backdrop-blur-[1px] dark:bg-gray-950/80'>
            <Lock className='mb-2 h-8 w-8 text-muted-foreground' />
            <span className='text-sm font-medium text-muted-foreground'>
              {t.common?.comingSoon || 'Coming soon'}
            </span>
          </div>
          {/* Content (below overlay, non-interactive) */}
          <div className='pointer-events-none space-y-6'>
            {/* This Device */}
            <div className='space-y-2'>
              <h4 className='text-sm font-medium'>
                {t.settings?.sync?.thisDevice || 'This device'}
              </h4>
              <div className='flex items-center gap-3 rounded-lg border p-3'>
                <div className='flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'>
                  <Laptop className='h-5 w-5' />
                </div>
                <div className='flex-1'>
                  {isEditing ? (
                    <div className='flex items-center gap-2'>
                      <Input
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        className='h-8'
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                      />
                      <Button size='sm' onClick={handleSaveName}>
                        <Check className='h-4 w-4' />
                      </Button>
                    </div>
                  ) : (
                    <div className='flex items-center gap-2'>
                      <span className='font-medium'>{deviceName}</span>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => {
                          setEditedName(deviceName);
                          setIsEditing(true);
                        }}
                        className='h-6 px-2 text-muted-foreground'
                      >
                        {t.common?.edit || 'Edit'}
                      </Button>
                    </div>
                  )}
                  <p className='text-xs text-muted-foreground'>
                    ID: {deviceId.slice(0, 8)}...
                  </p>
                </div>
                <div className='flex items-center gap-2'>
                  <Badge
                    variant={
                      isInitialized
                        ? 'default'
                        : lastError
                          ? 'destructive'
                          : 'secondary'
                    }
                  >
                    {isInitialized
                      ? t.settings?.sync?.ready || 'Ready'
                      : lastError
                        ? t.common?.error || 'Error'
                        : t.settings?.sync?.initializing || 'Initializing...'}
                  </Badge>
                  {lastError && (
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={retryInitialization}
                      className='h-6 px-2 text-xs'
                    >
                      {t.common?.retry || 'Retry'}
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Pairing Code */}
            <div className='space-y-2'>
              <h4 className='text-sm font-medium'>
                {t.settings?.sync?.pairingCode || 'Pairing code'}
              </h4>
              <p className='text-sm text-muted-foreground'>
                {t.settings?.sync?.pairingCodeDescription ||
                  'Share this code with another device to connect.'}
              </p>
              {pairingCode ? (
                <div className='flex items-center gap-2'>
                  <div className='flex-1 rounded-lg border bg-muted p-3 text-center font-mono text-2xl tracking-widest'>
                    {pairingCode}
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant='outline'
                          size='icon'
                          onClick={handleCopyCode}
                        >
                          {copiedCode ? (
                            <Check className='h-4 w-4' />
                          ) : (
                            <Copy className='h-4 w-4' />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {t.common?.copied || 'Copied!'}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <Button
                    variant='outline'
                    size='icon'
                    onClick={generateNewPairingCode}
                  >
                    <RefreshCw className='h-4 w-4' />
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={generateNewPairingCode}
                  disabled={!isInitialized}
                >
                  <QrCode className='mr-2 h-4 w-4' />
                  {t.settings?.sync?.generateCode || 'Generate pairing code'}
                </Button>
              )}
            </div>

            {/* Connect to Device */}
            <div className='space-y-2'>
              <h4 className='text-sm font-medium'>
                {t.settings?.sync?.connectToDevice || 'Connect to device'}
              </h4>
              <Button
                variant='outline'
                onClick={() => setIsPairingDialogOpen(true)}
                disabled={!isInitialized}
              >
                <Link className='mr-2 h-4 w-4' />
                {t.settings?.sync?.enterCode || 'Enter pairing code'}
              </Button>
            </div>

            {/* Paired Devices */}
            {pairedDevices.length > 0 && (
              <div className='space-y-2'>
                <h4 className='text-sm font-medium'>
                  {t.settings?.sync?.pairedDevices || 'Paired devices'}
                </h4>
                <div className='space-y-2'>
                  {pairedDevices.map((device) => (
                    <div
                      key={device.id}
                      className='flex items-center gap-3 rounded-lg border p-3'
                    >
                      <div
                        className={cn(
                          'flex h-10 w-10 items-center justify-center rounded-full',
                          device.isConnected
                            ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                        )}
                      >
                        {getDeviceIcon(device.name)}
                      </div>
                      <div className='flex-1'>
                        <div className='flex items-center gap-2'>
                          <span className='font-medium'>{device.name}</span>
                          {device.isConnected ? (
                            <Wifi className='h-3 w-3 text-green-500' />
                          ) : (
                            <WifiOff className='h-3 w-3 text-muted-foreground' />
                          )}
                        </div>
                        <p className='text-xs text-muted-foreground'>
                          {device.lastSyncAt
                            ? `${t.settings?.sync?.lastSync || 'Last sync'}: ${new Date(device.lastSyncAt).toLocaleString()}`
                            : t.settings?.sync?.neverSynced || 'Never synced'}
                        </p>
                      </div>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant='ghost'
                              size='icon'
                              className='text-destructive hover:bg-destructive/10'
                              onClick={() => disconnectDevice(device.id)}
                            >
                              <Trash2 className='h-4 w-4' />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {t.settings?.sync?.removeDevice || 'Remove device'}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Error Display */}
            {lastError && (
              <div className='rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive'>
                {lastError.message}
              </div>
            )}
          </div>
          {/* End of overlay content wrapper */}

          {/* Pending Pairing Request Dialog */}
          <Dialog
            open={!!pendingPairingRequest}
            onOpenChange={(open) => {
              if (!open && pendingPairingRequest) {
                pendingPairingRequest.reject();
              }
            }}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {t.settings?.sync?.pairingRequest || 'Pairing request'}
                </DialogTitle>
                <DialogDescription>
                  {(
                    t.settings?.sync?.pairingRequestDescription ||
                    '{device} wants to connect'
                  ).replace(
                    '{device}',
                    pendingPairingRequest?.deviceName || ''
                  )}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant='outline'
                  onClick={() => pendingPairingRequest?.reject()}
                >
                  {t.common?.cancel || 'Cancel'}
                </Button>
                <Button onClick={() => pendingPairingRequest?.accept()}>
                  {t.settings?.sync?.accept || 'Accept'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Connect Dialog */}
          <Dialog
            open={isPairingDialogOpen}
            onOpenChange={setIsPairingDialogOpen}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {t.settings?.sync?.connectToDevice || 'Connect to device'}
                </DialogTitle>
                <DialogDescription>
                  {t.settings?.sync?.enterCodeDescription ||
                    'Enter the pairing code shown on the other device.'}
                </DialogDescription>
              </DialogHeader>
              <div className='py-4'>
                <Input
                  placeholder='ABC123'
                  value={pairingInput}
                  onChange={(e) =>
                    setPairingInput(e.target.value.toUpperCase())
                  }
                  className='text-center font-mono text-sm tracking-widest'
                />
                {connectionError && (
                  <p className='mt-2 text-sm text-destructive'>
                    {connectionError}
                  </p>
                )}
              </div>
              <DialogFooter>
                <Button
                  variant='outline'
                  onClick={() => {
                    setPairingInput('');
                    setConnectionError(null);
                    setIsPairingDialogOpen(false);
                  }}
                >
                  {t.common?.cancel || 'Cancel'}
                </Button>
                <Button
                  onClick={handleConnect}
                  disabled={!pairingInput.trim() || isConnecting}
                >
                  {isConnecting
                    ? t.common?.loading || 'Loading...'
                    : t.settings?.sync?.connect || 'Connect'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
}
