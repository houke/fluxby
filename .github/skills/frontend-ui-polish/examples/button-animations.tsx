/**
 * Button Animation Examples
 *
 * Various button animation patterns using CSS and Framer Motion.
 */

import React from 'react';
import { motion } from 'framer-motion';
import './buttons.css';

// ============================================================================
// CSS-ONLY BUTTONS
// ============================================================================

export function CSSButton({ children }: { children: React.ReactNode }) {
  return <button className='css-button'>{children}</button>;
}

/*
.css-button {
  padding: 0.75rem 1.5rem;
  font-weight: 500;
  border-radius: 0.5rem;
  background: var(--color-primary);
  color: white;
  border: none;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: 
    transform 0.15s ease-out,
    box-shadow 0.15s ease-out;
}

.css-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.css-button:active {
  transform: translateY(0) scale(0.98);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}

.css-button:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
*/

// ============================================================================
// RIPPLE BUTTON (Material Design style)
// ============================================================================

export function RippleButton({ children }: { children: React.ReactNode }) {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;

    button.appendChild(ripple);

    setTimeout(() => ripple.remove(), 600);
  };

  return (
    <button className='ripple-button' onClick={handleClick}>
      {children}
    </button>
  );
}

/*
.ripple-button {
  position: relative;
  overflow: hidden;
  padding: 0.75rem 1.5rem;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
}

.ripple {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transform: scale(0);
  animation: ripple-effect 0.6s linear;
  pointer-events: none;
}

@keyframes ripple-effect {
  to {
    transform: scale(4);
    opacity: 0;
  }
}
*/

// ============================================================================
// SPRING BUTTON (Framer Motion)
// ============================================================================

export function SpringButton({ children }: { children: React.ReactNode }) {
  return (
    <motion.button
      className='spring-button'
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 17,
      }}
    >
      {children}
    </motion.button>
  );
}

// ============================================================================
// GRADIENT SHIFT BUTTON
// ============================================================================

export function GradientButton({ children }: { children: React.ReactNode }) {
  return (
    <motion.button
      className='gradient-button'
      whileHover='hover'
      whileTap={{ scale: 0.98 }}
    >
      <motion.span
        className='gradient-bg'
        variants={{
          hover: { x: '100%' },
        }}
        transition={{ duration: 0.3 }}
      />
      <span className='button-text'>{children}</span>
    </motion.button>
  );
}

/*
.gradient-button {
  position: relative;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(90deg, #3b82f6, #8b5cf6);
  color: white;
  border: none;
  border-radius: 0.5rem;
  overflow: hidden;
  cursor: pointer;
}

.gradient-bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, #8b5cf6, #ec4899, #3b82f6);
  opacity: 0;
  transition: opacity 0.3s;
}

.gradient-button:hover .gradient-bg {
  opacity: 1;
}

.button-text {
  position: relative;
  z-index: 1;
}
*/

// ============================================================================
// LOADING BUTTON
// ============================================================================

interface LoadingButtonProps {
  children: React.ReactNode;
  isLoading?: boolean;
  onClick?: () => void;
}

export function LoadingButton({
  children,
  isLoading = false,
  onClick,
}: LoadingButtonProps) {
  return (
    <motion.button
      className='loading-button'
      onClick={onClick}
      disabled={isLoading}
      whileTap={!isLoading ? { scale: 0.98 } : {}}
    >
      <motion.span
        animate={{ opacity: isLoading ? 0 : 1 }}
        transition={{ duration: 0.15 }}
      >
        {children}
      </motion.span>

      {isLoading && (
        <motion.div
          className='spinner'
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, rotate: 360 }}
          transition={{
            opacity: { duration: 0.15 },
            rotate: { duration: 1, repeat: Infinity, ease: 'linear' },
          }}
        >
          <svg viewBox='0 0 24 24' fill='none'>
            <circle
              cx='12'
              cy='12'
              r='10'
              stroke='currentColor'
              strokeWidth='3'
              strokeLinecap='round'
              strokeDasharray='32'
              strokeDashoffset='32'
            />
          </svg>
        </motion.div>
      )}
    </motion.button>
  );
}

// ============================================================================
// SUCCESS BUTTON
// ============================================================================

type ButtonState = 'idle' | 'loading' | 'success';

export function SuccessButton({
  children,
  state = 'idle',
}: {
  children: React.ReactNode;
  state?: ButtonState;
}) {
  const variants = {
    idle: {
      backgroundColor: '#3b82f6',
      width: 'auto',
    },
    loading: {
      backgroundColor: '#6b7280',
      width: 48,
    },
    success: {
      backgroundColor: '#10b981',
      width: 'auto',
    },
  };

  return (
    <motion.button
      className='success-button'
      variants={variants}
      animate={state}
      transition={{ duration: 0.3 }}
      disabled={state !== 'idle'}
    >
      {state === 'loading' ? (
        <motion.div
          className='spinner'
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      ) : state === 'success' ? (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 10 }}
        >
          ✓ Done
        </motion.span>
      ) : (
        children
      )}
    </motion.button>
  );
}

// ============================================================================
// ICON BUTTON WITH TOOLTIP
// ============================================================================

export function IconButton({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <motion.button
      className='icon-button'
      aria-label={label}
      whileHover='hover'
      whileTap={{ scale: 0.9 }}
    >
      <motion.span
        variants={{
          hover: { rotate: 15 },
        }}
        transition={{ type: 'spring', stiffness: 400 }}
      >
        {icon}
      </motion.span>

      <motion.span
        className='tooltip'
        variants={{
          hover: { opacity: 1, y: 0 },
        }}
        initial={{ opacity: 0, y: 4 }}
        transition={{ duration: 0.15 }}
      >
        {label}
      </motion.span>
    </motion.button>
  );
}

// ============================================================================
// MAGNETIC BUTTON (follows cursor)
// ============================================================================

export function MagneticButton({ children }: { children: React.ReactNode }) {
  const [position, setPosition] = React.useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    setPosition({
      x: (e.clientX - centerX) * 0.2,
      y: (e.clientY - centerY) * 0.2,
    });
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
  };

  return (
    <motion.button
      className='magnetic-button'
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: 'spring', stiffness: 150, damping: 15 }}
    >
      {children}
    </motion.button>
  );
}
