import { useEffect, useState, useRef } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

export default function SyncAnimation({ isVisible }: { isVisible: boolean }) {
  const { t } = useLanguage();
  const anim = t.animations?.sync;
  const [phase, setPhase] = useState<
    'discover' | 'connect' | 'sync' | 'complete'
  >('discover');
  const [progress, setProgress] = useState(0);
  const [dataPackets, setDataPackets] = useState<
    { id: number; direction: 'left' | 'right'; progress: number }[]
  >([]);
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const packetIdRef = useRef(0);

  useEffect(() => {
    if (isVisible) {
      const animate = (currentTime: number) => {
        if (!lastTimeRef.current) lastTimeRef.current = currentTime;
        const delta = currentTime - lastTimeRef.current;
        lastTimeRef.current = currentTime;

        setProgress((prev) => {
          const speed = phase === 'sync' ? 15 : 40;
          const newProgress = prev + (delta / 1000) * speed;

          if (phase === 'discover' && newProgress >= 100) {
            setPhase('connect');
            return 0;
          } else if (phase === 'connect' && newProgress >= 100) {
            setPhase('sync');
            return 0;
          } else if (phase === 'sync' && newProgress >= 100) {
            setPhase('complete');
            return 100;
          } else if (phase === 'complete' && newProgress >= 150) {
            setPhase('discover');
            setDataPackets([]);
            return 0;
          }
          return newProgress;
        });

        // Add data packets during sync phase
        if (phase === 'sync') {
          setDataPackets((prev) => {
            // Add new packet occasionally
            const shouldAddPacket = Math.random() < 0.03;
            let updated = [...prev];

            if (shouldAddPacket && updated.length < 6) {
              packetIdRef.current += 1;
              updated.push({
                id: packetIdRef.current,
                direction: Math.random() > 0.5 ? 'left' : 'right',
                progress: 0,
              });
            }

            // Update packet progress
            updated = updated
              .map((p) => ({
                ...p,
                progress: p.progress + (delta / 1000) * 120,
              }))
              .filter((p) => p.progress < 100);

            return updated;
          });
        }

        animationRef.current = requestAnimationFrame(animate);
      };

      animationRef.current = requestAnimationFrame(animate);
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      lastTimeRef.current = 0;
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isVisible, phase]);

  const DeviceIcon = ({
    type,
    isActive,
    label,
  }: {
    type: 'laptop' | 'phone';
    isActive: boolean;
    label: string;
  }) => (
    <div className='flex flex-col items-center'>
      <div
        className={`relative rounded-2xl p-4 transition-all duration-500 ${
          isActive
            ? 'bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-500/30'
            : 'bg-gray-200 dark:bg-white/10'
        }`}
      >
        {type === 'laptop' ? (
          <svg
            className={`h-12 w-12 ${isActive ? 'text-white' : 'text-gray-500 dark:text-white/50'}`}
            fill='none'
            viewBox='0 0 24 24'
            stroke='currentColor'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={1.5}
              d='M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'
            />
          </svg>
        ) : (
          <svg
            className={`h-12 w-12 ${isActive ? 'text-white' : 'text-gray-500 dark:text-white/50'}`}
            fill='none'
            viewBox='0 0 24 24'
            stroke='currentColor'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={1.5}
              d='M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z'
            />
          </svg>
        )}
        {/* Pulse ring when active */}
        {isActive && phase !== 'discover' && (
          <div className='absolute inset-0 animate-ping rounded-2xl bg-purple-400 opacity-20' />
        )}
      </div>
      <span
        className={`mt-2 text-xs font-medium ${isActive ? 'text-purple-600 dark:text-purple-400' : 'text-gray-500 dark:text-white/50'}`}
      >
        {label}
      </span>
    </div>
  );

  return (
    <div className='flex h-full w-full flex-col items-center justify-center p-8'>
      {/* Status badge */}
      <div
        className={`mb-6 rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-300 ${
          phase === 'discover'
            ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300'
            : phase === 'connect'
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300'
              : phase === 'sync'
                ? 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300'
                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
        }`}
      >
        {phase === 'discover' &&
          (anim?.discovering || 'Discovering devices...')}
        {phase === 'connect' && (anim?.connecting || 'Connecting...')}
        {phase === 'sync' && (anim?.syncing || 'Syncing data...')}
        {phase === 'complete' && (anim?.complete || 'Sync complete!')}
      </div>

      {/* Devices with connection */}
      <div className='relative flex w-full max-w-sm items-center justify-between'>
        <DeviceIcon
          type='laptop'
          isActive={phase !== 'discover' || progress > 30}
          label={anim?.device1 || 'Laptop'}
        />

        {/* Connection line area */}
        <div className='relative mx-4 h-20 flex-1'>
          {/* Base line */}
          <div className='absolute top-1/2 h-0.5 w-full -translate-y-1/2 bg-gray-200 dark:bg-white/10' />

          {/* Animated connection line */}
          {(phase === 'connect' ||
            phase === 'sync' ||
            phase === 'complete') && (
            <div
              className='absolute top-1/2 h-0.5 -translate-y-1/2 bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500'
              style={{
                width:
                  phase === 'connect' ? `${Math.min(progress, 100)}%` : '100%',
                left: 0,
              }}
            />
          )}

          {/* Data packets */}
          {dataPackets.map((packet) => (
            <div
              key={packet.id}
              className='absolute top-1/2 -translate-y-1/2'
              style={{
                left:
                  packet.direction === 'right'
                    ? `${packet.progress}%`
                    : `${100 - packet.progress}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <div
                className={`h-3 w-3 rounded-full ${
                  packet.direction === 'right'
                    ? 'bg-purple-500 shadow-lg shadow-purple-500/50'
                    : 'bg-pink-500 shadow-lg shadow-pink-500/50'
                }`}
              />
            </div>
          ))}

          {/* Sync arrows when complete */}
          {phase === 'complete' && (
            <div className='absolute inset-0 flex items-center justify-center'>
              <svg
                className='h-6 w-6 text-emerald-500'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M5 13l4 4L19 7'
                />
              </svg>
            </div>
          )}
        </div>

        <DeviceIcon
          type='phone'
          isActive={phase !== 'discover' || progress > 60}
          label={anim?.device2 || 'Phone'}
        />
      </div>

      {/* Sync stats */}
      {(phase === 'sync' || phase === 'complete') && (
        <div className='mt-6 flex items-center gap-6 text-sm'>
          <div className='flex items-center gap-2'>
            <div className='h-2 w-2 rounded-full bg-purple-500' />
            <span className='text-gray-600 dark:text-white/70'>
              {phase === 'complete' ? '156' : Math.floor(progress * 1.56)}{' '}
              {anim?.transactions || 'transactions'}
            </span>
          </div>
          <div className='flex items-center gap-2'>
            <div className='h-2 w-2 rounded-full bg-pink-500' />
            <span className='text-gray-600 dark:text-white/70'>
              {phase === 'complete' ? '12' : Math.floor(progress * 0.12)}{' '}
              {anim?.categories || 'categories'}
            </span>
          </div>
        </div>
      )}

      {/* P2P badge */}
      <div className='mt-4 flex items-center gap-2 rounded-lg bg-white/60 px-3 py-1.5 dark:bg-white/5'>
        <div className='flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500'>
          <svg
            className='h-3 w-3 text-white'
            fill='none'
            viewBox='0 0 24 24'
            stroke='currentColor'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4'
            />
          </svg>
        </div>
        <span className='text-xs font-medium text-gray-600 dark:text-white/70'>
          {anim?.p2pEncrypted || 'Peer-to-peer encrypted'}
        </span>
      </div>
    </div>
  );
}
