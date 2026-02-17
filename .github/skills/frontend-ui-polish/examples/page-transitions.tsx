/**
 * Page Transition Examples
 *
 * Patterns for smooth transitions between pages/views.
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================================================
// BASIC FADE TRANSITION
// ============================================================================

export function FadeTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
}

// ============================================================================
// SLIDE TRANSITIONS
// ============================================================================

type SlideDirection = 'left' | 'right' | 'up' | 'down';

const slideVariants = {
  left: { initial: { x: 100 }, exit: { x: -100 } },
  right: { initial: { x: -100 }, exit: { x: 100 } },
  up: { initial: { y: 100 }, exit: { y: -100 } },
  down: { initial: { y: -100 }, exit: { y: 100 } },
};

export function SlideTransition({
  children,
  direction = 'left',
}: {
  children: React.ReactNode;
  direction?: SlideDirection;
}) {
  const variants = slideVariants[direction];

  return (
    <motion.div
      initial={{ ...variants.initial, opacity: 0 }}
      animate={{ x: 0, y: 0, opacity: 1 }}
      exit={{ ...variants.exit, opacity: 0 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
    >
      {children}
    </motion.div>
  );
}

// ============================================================================
// SCALE FADE TRANSITION
// ============================================================================

export function ScaleFadeTransition({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  );
}

// ============================================================================
// SHARED LAYOUT TRANSITION
// ============================================================================

interface Item {
  id: string;
  title: string;
  description: string;
  image: string;
}

export function SharedLayoutDemo({ items }: { items: Item[] }) {
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const selectedItem = items.find((item) => item.id === selectedId);

  return (
    <>
      <div className='grid'>
        {items.map((item) => (
          <motion.div
            key={item.id}
            layoutId={item.id}
            onClick={() => setSelectedId(item.id)}
            className='card'
          >
            <motion.img
              layoutId={`image-${item.id}`}
              src={item.image}
              alt={item.title}
            />
            <motion.h3 layoutId={`title-${item.id}`}>{item.title}</motion.h3>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {selectedId && selectedItem && (
          <motion.div
            className='modal-overlay'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedId(null)}
          >
            <motion.div
              layoutId={selectedId}
              className='modal-card'
              onClick={(e) => e.stopPropagation()}
            >
              <motion.img
                layoutId={`image-${selectedId}`}
                src={selectedItem.image}
                alt={selectedItem.title}
              />
              <motion.h3 layoutId={`title-${selectedId}`}>
                {selectedItem.title}
              </motion.h3>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {selectedItem.description}
              </motion.p>
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                onClick={() => setSelectedId(null)}
              >
                Close
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ============================================================================
// STAGGER CHILDREN TRANSITION
// ============================================================================

const containerVariants = {
  hidden: { opacity: 0 },
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

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

export function StaggerTransition({ items }: { items: React.ReactNode[] }) {
  return (
    <motion.ul
      variants={containerVariants}
      initial='hidden'
      animate='visible'
      exit='exit'
    >
      {items.map((item, index) => (
        <motion.li key={index} variants={itemVariants}>
          {item}
        </motion.li>
      ))}
    </motion.ul>
  );
}

// ============================================================================
// ROUTE TRANSITION WRAPPER
// ============================================================================

interface RouteTransitionProps {
  children: React.ReactNode;
  pathname: string;
}

export function RouteTransition({ children, pathname }: RouteTransitionProps) {
  return (
    <AnimatePresence mode='wait'>
      <motion.div
        key={pathname}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{
          duration: 0.3,
          ease: [0.25, 0.1, 0.25, 1],
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

// Usage with React Router:
// <RouteTransition pathname={location.pathname}>
//   <Routes location={location}>
//     <Route path="/" element={<Home />} />
//     <Route path="/about" element={<About />} />
//   </Routes>
// </RouteTransition>

// ============================================================================
// CROSSFADE IMAGE TRANSITION
// ============================================================================

export function CrossfadeImage({ src, alt }: { src: string; alt: string }) {
  return (
    <AnimatePresence mode='wait'>
      <motion.img
        key={src}
        src={src}
        alt={alt}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      />
    </AnimatePresence>
  );
}

// ============================================================================
// MORPH TRANSITION
// ============================================================================

export function MorphButton({
  expanded,
  onToggle,
}: {
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <motion.div
      layout
      onClick={onToggle}
      animate={{
        width: expanded ? 300 : 100,
        height: expanded ? 200 : 40,
        borderRadius: expanded ? 16 : 20,
      }}
      transition={{
        type: 'spring',
        stiffness: 200,
        damping: 20,
      }}
      className='morph-container'
    >
      <AnimatePresence mode='wait'>
        {expanded ? (
          <motion.div
            key='expanded'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='expanded-content'
          >
            <h3>Expanded View</h3>
            <p>More content here...</p>
          </motion.div>
        ) : (
          <motion.span
            key='collapsed'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            Click me
          </motion.span>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
