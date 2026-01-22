/**
 * Sync Settings Component
 * UI for peer-to-peer device syncing
 */
import { useState, useRef } from 'react';
import {
  Smartphone,
  Laptop,
  Check,
  Trash2,
  Wifi,
  WifiOff,
  QrCode,
  Link,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
  History,
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
import { useToast } from '@/contexts/ToastContext';
import { cn } from '@/lib/utils';
import { SyncDebugPanel } from './SyncDebugPanel';
import { SyncHistoryViewer } from './SyncHistoryViewer';
import { QRPairingDialog } from './QRPairingDialog';

export function SyncSettings() {
  const { t } = useLanguage();
  const toast = useToast();
  const {
    deviceId,
    deviceName,
    setDeviceName,
    isInitialized,
    connectWithPairingCode,
    pairedDevices,
    pendingPairingRequest,
    disconnectDevice,
    lastError,
    retryInitialization,
    syncStatus,
    forceSync,
    autoSyncEnabled,
    setAutoSyncEnabled,
  } = useSync();

  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(deviceName);
  const [pairingInput, setPairingInput] = useState('');
  const [isPairingDialogOpen, setIsPairingDialogOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [showHistoryViewer, setShowHistoryViewer] = useState(false);
  const [isSyncingManual, setIsSyncingManual] = useState(false);

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
      } else if (
        errorMessage.toLowerCase().includes('timeout') ||
        errorMessage.toLowerCase().includes('time-out')
      ) {
        setConnectionError(
          t.settings?.sync?.connectionTimeout ||
            'Connection timeout - the other device may be behind a firewall. Try a different network.'
        );
      } else if (
        errorMessage.toLowerCase().includes('schema version mismatch')
      ) {
        setConnectionError(
          t.settings?.sync?.schemaMismatch ||
            'This device has a different app version. Update both devices to the latest version to sync.'
        );
      } else if (
        errorMessage.toLowerCase().includes('protocol version mismatch')
      ) {
        setConnectionError(
          t.settings?.sync?.protocolMismatch ||
            'This device uses an incompatible sync version. Update both devices to the latest version.'
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
    <div className=''>
      <Card className='rounded-none border-x-0 shadow-none sm:rounded-2xl sm:border-x sm:shadow-sm'>
        <CardHeader className='px-3 py-3 sm:px-6 sm:py-4'>
          <div className='flex items-start justify-between gap-4'>
            <div>
              <CardTitle
                className='flex cursor-default items-center gap-2 text-base select-none sm:text-lg'
                onClick={handleTitleClick}
              >
                {t.settings?.sync?.title || 'Device sync'}
              </CardTitle>
              <CardDescription className='text-xs sm:text-sm'>
                {t.settings?.sync?.description ||
                  'Sync your data across devices using peer-to-peer connections. No server required.'}
              </CardDescription>
            </div>
            {/* Sync Status & Controls - Compact */}
            <div className='flex items-center gap-2'>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-full',
                        syncStatus.state === 'idle' &&
                          syncStatus.connectedPeers > 0
                          ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                          : syncStatus.state === 'syncing'
                            ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'
                            : syncStatus.state === 'error'
                              ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                              : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                      )}
                    >
                      {syncStatus.isSyncing ? (
                        <RefreshCw className='h-4 w-4 animate-spin' />
                      ) : syncStatus.connectedPeers > 0 ? (
                        <Wifi className='h-4 w-4' />
                      ) : (
                        <WifiOff className='h-4 w-4' />
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className='text-center'>
                      <p className='font-medium'>
                        {syncStatus.state === 'syncing'
                          ? t.settings?.sync?.syncing || 'Syncing...'
                          : syncStatus.connectedPeers > 0
                            ? t.settings?.sync?.connected || 'Connected'
                            : t.settings?.sync?.notConnected || 'Not connected'}
                      </p>
                      <p className='text-xs text-muted-foreground'>
                        {syncStatus.connectedPeers}{' '}
                        {syncStatus.connectedPeers === 1 ? 'device' : 'devices'}
                      </p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant='ghost'
                      size='icon'
                      className='h-8 w-8 rounded-md hover:bg-purple-600 hover:text-white'
                      disabled={
                        !isInitialized ||
                        syncStatus.connectedPeers === 0 ||
                        isSyncingManual
                      }
                      onClick={async () => {
                        if (
                          !isInitialized ||
                          syncStatus.connectedPeers === 0 ||
                          isSyncingManual
                        ) {
                          return;
                        }
                        setIsSyncingManual(true);
                        try {
                          const result = await forceSync();
                          if (!result.success) {
                            toast.error(
                              result.error ||
                                t.settings?.sync?.syncError ||
                                'Sync failed'
                            );
                          } else if (
                            result.changesReceived === 0 &&
                            result.changesPushed === 0
                          ) {
                            toast.info(
                              t.settings?.sync?.syncNoChanges ||
                                'No new changes to sync'
                            );
                          } else {
                            const message = (
                              t.settings?.sync?.syncSuccess ||
                              'Synced {received} received, {pushed} sent'
                            )
                              .replace(
                                '{received}',
                                String(result.changesReceived)
                              )
                              .replace(
                                '{pushed}',
                                String(result.changesPushed)
                              );
                            toast.success(message);
                          }
                        } catch (error) {
                          toast.error(
                            error instanceof Error
                              ? error.message
                              : t.settings?.sync?.syncError || 'Sync failed'
                          );
                        } finally {
                          setIsSyncingManual(false);
                        }
                      }}
                    >
                      <RefreshCw
                        className={cn(
                          'h-4 w-4',
                          (isSyncingManual || syncStatus.isSyncing) &&
                            'animate-spin'
                        )}
                      />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className='text-center'>
                      <p className='font-medium'>
                        {t.settings?.sync?.syncNow || 'Sync now'}
                      </p>
                      <p className='text-xs text-muted-foreground'>
                        {syncStatus.connectedPeers === 0
                          ? 'Connect to a device to sync'
                          : t.settings?.sync?.syncNowTooltip ||
                            'Force sync with all connected devices'}
                      </p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant='ghost'
                      size='icon'
                      className='group h-8 w-8 rounded-md hover:bg-purple-600 hover:text-white'
                      onClick={() => setAutoSyncEnabled(!autoSyncEnabled)}
                    >
                      {autoSyncEnabled ? (
                        <ToggleRight className='h-5 w-5 text-purple-600 group-hover:text-white dark:text-purple-400' />
                      ) : (
                        <ToggleLeft className='h-5 w-5 text-muted-foreground group-hover:text-white' />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className='text-center'>
                      <p className='font-medium'>
                        {t.settings?.sync?.autoSync || 'Auto-sync'}
                      </p>
                      <p className='text-xs text-muted-foreground'>
                        {autoSyncEnabled
                          ? 'Changes sync automatically'
                          : 'Manual sync only'}
                      </p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant='ghost'
                      size='icon'
                      className='group h-8 w-8 rounded-md hover:bg-purple-600 hover:text-white'
                      onClick={() => setShowHistoryViewer(!showHistoryViewer)}
                    >
                      <History className='h-4 w-4 text-muted-foreground group-hover:text-white' />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className='font-medium'>
                      {t.settings?.sync?.syncHistory || 'Sync history'}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </CardHeader>
        <CardContent className='relative px-3 pt-0 pb-3 sm:px-6 sm:pt-0 sm:pb-6'>
          {/* Debug Panel (hidden by default, triple-click title to show) */}
          {showDebugPanel && (
            <div className='mb-4'>
              <SyncDebugPanel onClose={() => setShowDebugPanel(false)} />
            </div>
          )}

          {/* Sync History Viewer */}
          {showHistoryViewer && (
            <div className='mb-4'>
              <SyncHistoryViewer onClose={() => setShowHistoryViewer(false)} />
            </div>
          )}

          <div className='space-y-6'>
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

            {/* Connection settings */}
            <h4 className='mb-1 text-sm font-medium'>
              {t.settings?.sync?.connectionSettings || 'Connection settings'}
            </h4>

            {/* Pairing Code & Connect to Device - 2 rows */}
            <div className='space-y-2'>
              <div className='flex items-center justify-between rounded-lg border p-3'>
                <div className='flex-1'>
                  <p className='text-sm font-medium'>
                    {t.settings?.sync?.pairingCode || 'Pairing code'}
                  </p>
                  <p className='text-xs text-muted-foreground'>
                    {t.settings?.sync?.pairingCodeDescription ||
                      'Share this code with another device to connect.'}
                  </p>
                </div>
                <QRPairingDialog
                  trigger={
                    <Button disabled={!isInitialized} size='sm'>
                      <QrCode className='mr-2 h-4 w-4' />
                      {t.settings?.sync?.showQRCode || 'Show QR code'}
                    </Button>
                  }
                />
              </div>
              <div className='flex items-center justify-between rounded-lg border p-3'>
                <div className='flex-1'>
                  <p className='text-sm font-medium'>
                    {t.settings?.sync?.connectToDevice || 'Connect to device'}
                  </p>
                  <p className='text-xs text-muted-foreground'>
                    {t.settings?.sync?.enterCodeDescription ||
                      'Enter the pairing code shown on the other device.'}
                  </p>
                </div>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setIsPairingDialogOpen(true)}
                  disabled={!isInitialized}
                >
                  <Link className='mr-2 h-4 w-4' />
                  {t.settings?.sync?.enterCode || 'Enter pairing code'}
                </Button>
              </div>
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
            onOpenChange={(open) => {
              if (!open) {
                // Reset all state when dialog closes (cancel, ESC, click outside)
                setPairingInput('');
                setConnectionError(null);
                setIsConnecting(false);
              }
              setIsPairingDialogOpen(open);
            }}
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
                  placeholder={
                    t.settings?.sync?.pairingPlaceholder ||
                    'fluxby-abc123...:ABCDEF'
                  }
                  value={pairingInput}
                  onChange={(e) => setPairingInput(e.target.value)}
                  className='text-center font-mono text-sm tracking-widest'
                />
                <p className='mt-2 text-xs text-muted-foreground'>
                  {t.settings?.sync?.pairingHint ||
                    'Enter the full pairing code including the colon. The code is case-sensitive.'}
                </p>
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
                    setIsConnecting(false);
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
