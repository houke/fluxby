/**
 * Sync Debug Panel
 * Hidden debug view for testing PeerJS connectivity
 * Access via Settings > Sync > Triple-click on "Device Sync" title
 */
import { useState, useEffect, useCallback } from 'react';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Wifi,
  WifiOff,
  Send,
  RefreshCw,
  Trash2,
  Download,
  Activity,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { useSync } from '@/contexts/SyncContext';
import {
  getSyncLogger,
  type SyncLogEntry,
  type SyncLogLevel,
} from '@fluxby/core';
import { cn } from '@/lib/utils';

interface SyncDebugPanelProps {
  onClose?: () => void;
}

export function SyncDebugPanel({ onClose }: SyncDebugPanelProps) {
  const {
    deviceId,
    deviceName,
    isInitialized,
    pairingCode,
    generateNewPairingCode,
    pairedDevices,
    lastError,
    retryInitialization,
  } = useSync();

  const [targetPeerId, setTargetPeerId] = useState('');
  const [pingPayload, setPingPayload] = useState('PING');
  const [logEntries, setLogEntries] = useState<SyncLogEntry[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [filterLevel, setFilterLevel] = useState<SyncLogLevel | 'all'>('all');
  const [pingResults, setPingResults] = useState<
    Array<{ peerId: string; rtt: number; timestamp: number }>
  >([]);

  const logger = getSyncLogger();

  // Refresh logs
  const refreshLogs = useCallback(() => {
    const entries = logger.getEntries();
    setLogEntries([...entries].reverse());
  }, [logger]);

  // Auto-refresh logs
  useEffect(() => {
    refreshLogs();
    if (autoRefresh) {
      const interval = setInterval(refreshLogs, 1000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshLogs]);

  // Send debug ping
  const sendPing = useCallback(async () => {
    if (!targetPeerId.trim()) return;

    try {
      // Note: This would need to be connected via the enhanced peer sync
      // For now, we just log the attempt
      logger.info(
        'connection:data',
        `Sending PING to ${targetPeerId}`,
        targetPeerId,
        {
          payload: pingPayload,
        }
      );

      // Simulate ping result for demo
      // In real implementation, this would come from onDebugPong callback
      setTimeout(() => {
        const rtt = Math.floor(Math.random() * 100) + 20;
        setPingResults((prev) => [
          { peerId: targetPeerId, rtt, timestamp: Date.now() },
          ...prev.slice(0, 9),
        ]);
      }, 100);
    } catch (error) {
      logger.error(
        'connection:error',
        `Failed to send ping: ${error}`,
        targetPeerId
      );
    }
    refreshLogs();
  }, [targetPeerId, pingPayload, logger, refreshLogs]);

  // Clear logs
  const clearLogs = useCallback(() => {
    logger.clear();
    refreshLogs();
  }, [logger, refreshLogs]);

  // Export logs
  const exportLogs = useCallback(() => {
    const data = logger.export();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fluxby-sync-logs-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [logger]);

  // Filter logs
  const filteredLogs = logEntries.filter(
    (entry) => filterLevel === 'all' || entry.level === filterLevel
  );

  // Get log stats
  const stats = logger.getStats();

  return (
    <Card className='border-orange-500'>
      <CardHeader className='pb-2'>
        <div className='flex items-center justify-between'>
          <div>
            <CardTitle className='flex items-center gap-2 text-orange-600'>
              <Activity className='h-5 w-5' />
              Sync Debug Panel
            </CardTitle>
            <CardDescription>
              Debug tools for PeerJS connectivity. Pairing code format:{' '}
              {'{peerId}:{6-char-code}'}
            </CardDescription>
          </div>
          {onClose && (
            <Button variant='ghost' size='sm' onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className='space-y-4'>
        {/* Connection Status */}
        <div className='rounded-lg bg-gray-50 p-3 dark:bg-gray-900'>
          <h4 className='mb-2 text-sm font-medium'>Connection Status</h4>
          <div className='grid grid-cols-2 gap-2 text-sm'>
            <div className='flex items-center gap-2'>
              <span className='text-muted-foreground'>Status:</span>
              {isInitialized ? (
                <Badge variant='default' className='bg-green-600'>
                  <Wifi className='mr-1 h-3 w-3' /> Connected
                </Badge>
              ) : (
                <Badge variant='destructive'>
                  <WifiOff className='mr-1 h-3 w-3' /> Disconnected
                </Badge>
              )}
            </div>
            <div className='flex items-center gap-2'>
              <span className='text-muted-foreground'>Device ID:</span>
              <code className='text-xs'>{deviceId.slice(0, 8)}...</code>
            </div>
            <div className='flex items-center gap-2'>
              <span className='text-muted-foreground'>Device Name:</span>
              <span>{deviceName}</span>
            </div>
            <div className='flex items-center gap-2'>
              <span className='text-muted-foreground'>Paired:</span>
              <span>{pairedDevices.length} devices</span>
            </div>
          </div>
          {lastError && (
            <div className='mt-2 flex items-center gap-2 text-red-600'>
              <AlertCircle className='h-4 w-4' />
              <span className='text-sm'>{lastError.message}</span>
            </div>
          )}
          <div className='mt-2 flex gap-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={retryInitialization}
              disabled={isInitialized}
            >
              <RefreshCw className='mr-1 h-3 w-3' />
              Retry Init
            </Button>
            <Button
              variant='outline'
              size='sm'
              onClick={generateNewPairingCode}
              disabled={!isInitialized}
            >
              Generate Code
            </Button>
            {pairingCode && (
              <code className='flex items-center rounded bg-gray-200 px-2 text-xs dark:bg-gray-800'>
                {pairingCode}
              </code>
            )}
          </div>
        </div>

        {/* Ping Test */}
        <div className='rounded-lg bg-gray-50 p-3 dark:bg-gray-900'>
          <h4 className='mb-2 text-sm font-medium'>
            Connectivity Test (Simulated)
          </h4>
          <p className='mb-2 text-xs text-muted-foreground'>
            Note: This ping test is simulated for debugging logs. To test real
            connectivity, use the &quot;Pair device&quot; button to connect with
            another device using a pairing code.
          </p>
          <div className='flex gap-2'>
            <Input
              placeholder='Target Peer ID'
              value={targetPeerId}
              onChange={(e) => setTargetPeerId(e.target.value)}
              className='flex-1 text-sm'
            />
            <Input
              placeholder='Payload'
              value={pingPayload}
              onChange={(e) => setPingPayload(e.target.value)}
              className='w-24 text-sm'
            />
            <Button
              size='sm'
              onClick={sendPing}
              disabled={!targetPeerId.trim()}
            >
              <Send className='mr-1 h-3 w-3' />
              Ping
            </Button>
          </div>
          {pingResults.length > 0 && (
            <div className='mt-2 space-y-1'>
              {pingResults.slice(0, 3).map((result, i) => (
                <div
                  key={`${result.timestamp}-${i}`}
                  className='flex items-center gap-2 text-xs'
                >
                  <Clock className='h-3 w-3 text-muted-foreground' />
                  <span className='font-mono'>
                    {result.peerId.slice(0, 16)}...
                  </span>
                  <Badge
                    variant='outline'
                    className={cn(
                      result.rtt < 50
                        ? 'border-green-500 text-green-600'
                        : result.rtt < 100
                          ? 'border-yellow-500 text-yellow-600'
                          : 'border-red-500 text-red-600'
                    )}
                  >
                    {result.rtt}ms
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Log Stats */}
        <div className='flex items-center gap-2 text-xs'>
          <Badge variant='secondary'>{stats.totalEntries} entries</Badge>
          <Badge variant='outline' className='text-red-600'>
            {stats.errorCount} errors
          </Badge>
          <Badge variant='outline' className='text-yellow-600'>
            {stats.warningCount} warnings
          </Badge>
          <div className='flex-1' />
          <Button
            variant='ghost'
            size='sm'
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={cn(autoRefresh && 'text-green-600')}
          >
            <RefreshCw
              className={cn('mr-1 h-3 w-3', autoRefresh && 'animate-spin')}
            />
            Auto
          </Button>
          <Button variant='ghost' size='sm' onClick={exportLogs}>
            <Download className='mr-1 h-3 w-3' />
            Export
          </Button>
          <Button variant='ghost' size='sm' onClick={clearLogs}>
            <Trash2 className='mr-1 h-3 w-3' />
            Clear
          </Button>
        </div>

        {/* Log Filter */}
        <div className='flex gap-1'>
          {(['all', 'debug', 'info', 'warn', 'error'] as const).map((level) => (
            <Button
              key={level}
              variant={filterLevel === level ? 'default' : 'outline'}
              size='sm'
              onClick={() => setFilterLevel(level)}
              className='text-xs'
            >
              {level.charAt(0).toUpperCase() + level.slice(1)}
            </Button>
          ))}
        </div>

        {/* Log Entries */}
        <ScrollArea className='h-64 rounded-lg border'>
          <div className='space-y-1 p-2'>
            {filteredLogs.length === 0 ? (
              <div className='p-4 text-center text-sm text-muted-foreground'>
                No log entries
              </div>
            ) : (
              filteredLogs.map((entry, i) => (
                <div
                  key={`${entry.timestamp}-${i}`}
                  className={cn(
                    'rounded px-2 py-1 font-mono text-xs',
                    entry.level === 'error' &&
                      'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300',
                    entry.level === 'warn' &&
                      'bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300',
                    entry.level === 'info' &&
                      'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
                    entry.level === 'debug' &&
                      'bg-gray-50 text-gray-600 dark:bg-gray-900 dark:text-gray-400'
                  )}
                >
                  <span className='text-muted-foreground'>
                    {new Date(entry.timestamp)
                      .toISOString()
                      .split('T')[1]
                      .slice(0, 12)}
                  </span>{' '}
                  <span
                    className={cn(
                      'font-semibold',
                      entry.event.startsWith('peer:') && 'text-purple-600',
                      entry.event.startsWith('connection:') && 'text-blue-600',
                      entry.event.startsWith('heartbeat:') && 'text-green-600',
                      entry.event.startsWith('sync:') && 'text-pink-600'
                    )}
                  >
                    [{entry.event}]
                  </span>{' '}
                  {entry.peerId && (
                    <span className='text-muted-foreground'>
                      [{entry.peerId.slice(0, 8)}...]
                    </span>
                  )}{' '}
                  {entry.message}
                  {entry.data && (
                    <span className='text-muted-foreground'>
                      {' '}
                      {JSON.stringify(entry.data)}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Paired Devices */}
        {pairedDevices.length > 0 && (
          <div className='rounded-lg bg-gray-50 p-3 dark:bg-gray-900'>
            <h4 className='mb-2 text-sm font-medium'>Paired Devices</h4>
            <div className='space-y-2'>
              {pairedDevices.map((device) => (
                <div
                  key={device.id}
                  className='flex items-center justify-between text-sm'
                >
                  <div className='flex items-center gap-2'>
                    <div
                      className={cn(
                        'h-2 w-2 rounded-full',
                        device.isConnected ? 'bg-green-500' : 'bg-gray-300'
                      )}
                    />
                    <span>{device.name}</span>
                    <code className='text-xs text-muted-foreground'>
                      {device.peerId.slice(0, 12)}...
                    </code>
                  </div>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() => setTargetPeerId(device.peerId)}
                  >
                    Test
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
