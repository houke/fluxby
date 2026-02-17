# Component Animation Template

Use this template when adding animations to React components.

```tsx
/**
 * @file ComponentName.tsx
 * @description Animated component with micro-interactions
 */

import React from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import styles from './ComponentName.module.css';

// ============================================================================
// ANIMATION VARIANTS
// ============================================================================

const containerVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: 0.05,
      staggerDirection: -1,
    },
  },
};

const itemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 24,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
  },
};

// ============================================================================
// REDUCED MOTION SUPPORT
// ============================================================================

const reducedMotionVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const useReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return prefersReducedMotion;
};

// ============================================================================
// COMPONENT PROPS
// ============================================================================

interface ComponentNameProps {
  items: Array<{ id: string; title: string }>;
  isVisible?: boolean;
  onItemClick?: (id: string) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ComponentName({
  items,
  isVisible = true,
  onItemClick,
}: ComponentNameProps) {
  const prefersReducedMotion = useReducedMotion();

  const variants = prefersReducedMotion
    ? reducedMotionVariants
    : containerVariants;

  const childVariants = prefersReducedMotion
    ? reducedMotionVariants
    : itemVariants;

  return (
    <AnimatePresence mode='wait'>
      {isVisible && (
        <motion.div
          className={styles.container}
          variants={variants}
          initial='hidden'
          animate='visible'
          exit='exit'
        >
          {items.map((item) => (
            <motion.button
              key={item.id}
              className={styles.item}
              variants={childVariants}
              whileHover={prefersReducedMotion ? {} : { scale: 1.02 }}
              whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
              onClick={() => onItemClick?.(item.id)}
            >
              {item.title}
            </motion.button>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ============================================================================
// CSS MODULE (ComponentName.module.css)
// ============================================================================

/*
.container {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.item {
  padding: var(--space-3) var(--space-4);
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: box-shadow var(--duration-fast) var(--ease-out);
}

.item:hover {
  box-shadow: var(--shadow-md);
}

.item:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  .item {
    transition: none;
  }
}
*/

export default ComponentName;
```

## Usage Example

```tsx
import { ComponentName } from './ComponentName';

function App() {
  const items = [
    { id: '1', title: 'First Item' },
    { id: '2', title: 'Second Item' },
    { id: '3', title: 'Third Item' },
  ];

  return (
    <ComponentName
      items={items}
      isVisible={true}
      onItemClick={(id) => console.log('Clicked:', id)}
    />
  );
}
```

## Checklist

- [ ] Animation variants defined
- [ ] Reduced motion support implemented
- [ ] Exit animations with AnimatePresence
- [ ] Accessible focus states
- [ ] Hover/tap interactions
- [ ] CSS transitions as fallback
- [ ] TypeScript props interface
