/**
 * Loading States Examples
 *
 * Various loading patterns including skeletons, spinners, and progress indicators.
 */

import React from 'react';
import { motion } from 'framer-motion';
import './loading.css';

// ============================================================================
// SPINNER VARIANTS
// ============================================================================

export function BasicSpinner({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox='0 0 24 24' className='spinner'>
      <circle
        cx='12'
        cy='12'
        r='10'
        fill='none'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
        strokeDasharray='32'
        strokeDashoffset='32'
      />
    </svg>
  );
}

/*
.spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
*/

export function DotsSpinner() {
  return (
    <div className='dots-spinner'>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className='dot'
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: i * 0.15,
          }}
        />
      ))}
    </div>
  );
}

export function PulseSpinner() {
  return (
    <motion.div
      className='pulse-spinner'
      animate={{
        scale: [1, 1.2, 1],
        opacity: [0.7, 0.3, 0.7],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  );
}

// ============================================================================
// SKELETON COMPONENTS
// ============================================================================

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
}

export function Skeleton({
  width = '100%',
  height = 20,
  borderRadius = 4,
  className = '',
}: SkeletonProps) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{ width, height, borderRadius }}
    />
  );
}

/*
.skeleton {
  background: linear-gradient(
    90deg,
    #e5e7eb 25%,
    #f3f4f6 50%,
    #e5e7eb 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
*/

export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className='skeleton-text'>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          width={i === lines - 1 ? '60%' : '100%'}
          height={16}
          className='skeleton-line'
        />
      ))}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className='skeleton-card'>
      <Skeleton height={200} borderRadius={8} />
      <div className='skeleton-card-content'>
        <Skeleton height={24} width='70%' />
        <SkeletonText lines={2} />
        <div className='skeleton-card-footer'>
          <Skeleton height={32} width={32} borderRadius='50%' />
          <Skeleton height={16} width={100} />
        </div>
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className='skeleton-table'>
      <div className='skeleton-table-header'>
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} height={20} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className='skeleton-table-row'>
          {[1, 2, 3, 4].map((j) => (
            <Skeleton key={j} height={16} />
          ))}
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// PROGRESS INDICATORS
// ============================================================================

interface ProgressBarProps {
  value: number;
  max?: number;
  showLabel?: boolean;
}

export function ProgressBar({
  value,
  max = 100,
  showLabel = false,
}: ProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100);

  return (
    <div className='progress-container'>
      <div
        className='progress-track'
        role='progressbar'
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <motion.div
          className='progress-fill'
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
      {showLabel && (
        <span className='progress-label'>{Math.round(percentage)}%</span>
      )}
    </div>
  );
}

export function CircularProgress({
  value,
  size = 60,
  strokeWidth = 4,
}: {
  value: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  return (
    <svg width={size} height={size} className='circular-progress'>
      <circle
        className='progress-bg'
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill='none'
        strokeWidth={strokeWidth}
      />
      <motion.circle
        className='progress-value'
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill='none'
        strokeWidth={strokeWidth}
        strokeLinecap='round'
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{
          strokeDasharray: circumference,
          transform: 'rotate(-90deg)',
          transformOrigin: 'center',
        }}
      />
      <text
        x='50%'
        y='50%'
        textAnchor='middle'
        dy='0.3em'
        className='progress-text'
      >
        {value}%
      </text>
    </svg>
  );
}

// ============================================================================
// CONTENT LOADING STATES
// ============================================================================

type LoadingState = 'loading' | 'success' | 'error';

interface AsyncContentProps {
  state: LoadingState;
  skeleton: React.ReactNode;
  children: React.ReactNode;
  error?: React.ReactNode;
}

export function AsyncContent({
  state,
  skeleton,
  children,
  error,
}: AsyncContentProps) {
  return (
    <motion.div
      key={state}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {state === 'loading' && skeleton}
      {state === 'success' && children}
      {state === 'error' && (error || <DefaultError />)}
    </motion.div>
  );
}

function DefaultError() {
  return (
    <div className='error-state'>
      <span className='error-icon'>⚠️</span>
      <p>Something went wrong</p>
      <button>Try again</button>
    </div>
  );
}

// ============================================================================
// FULL PAGE LOADER
// ============================================================================

export function PageLoader() {
  return (
    <motion.div
      className='page-loader'
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className='loader-content'
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <BasicSpinner size={48} />
        <p>Loading...</p>
      </motion.div>
    </motion.div>
  );
}

// ============================================================================
// INLINE LOADING BUTTON
// ============================================================================

export function LoadingButton({
  loading,
  children,
  onClick,
}: {
  loading: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button onClick={onClick} disabled={loading} className='loading-button'>
      <span className={loading ? 'invisible' : ''}>{children}</span>
      {loading && (
        <motion.div
          className='button-spinner'
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <BasicSpinner size={16} />
        </motion.div>
      )}
    </button>
  );
}
