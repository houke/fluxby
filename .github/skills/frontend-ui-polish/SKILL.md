---
name: frontend-ui-polish
description: Expertise in UI/UX excellence, custom animations, transitions, and "the juice" that makes interfaces feel premium. Use when styling components, adding motion, or refining visual hierarchy.
---

# Frontend UI Polish Skill

Apply high-end visual aesthetics and smooth interactions to make interfaces feel premium and delightful.

## Quick Start

```typescript
import { motion } from 'framer-motion';

// Animated component with spring physics
<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
>
  Click me
</motion.button>
```

## Skill Contents

### Documentation

- `docs/animation-principles.md` - 12 principles of animation for UI
- `docs/design-tokens.md` - Design token architecture
- `docs/micro-interactions.md` - Micro-interaction patterns and timing

### Examples

- `examples/button-animations.tsx` - Button hover and click animations
- `examples/page-transitions.tsx` - Route transition animations
- `examples/loading-states.tsx` - Content loading states and skeletons

### Templates

- `templates/animated-component.md` - Animated component template

### Reference

- `REFERENCE.md` - Quick reference cheatsheet

## Core Pillars

### 1. "The Juice"

Micro-interactions, tactile feedback, and subtle animations that make interfaces feel alive:

```typescript
// Button with satisfying feedback
const Button = ({ children, onClick }) => {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{
        scale: 1.02,
        boxShadow: '0 4px 20px rgba(0,0,0,0.12)'
      }}
      whileTap={{ scale: 0.98 }}
      transition={{
        type: 'spring',
        stiffness: 500,
        damping: 30
      }}
    >
      {children}
    </motion.button>
  );
};
```

### 2. Visual Hierarchy

Guide user focus through contrast, spacing, and typography:

```css
/* Establish clear hierarchy */
.heading-1 {
  font-size: var(--font-size-4xl);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-tight);
  letter-spacing: var(--letter-spacing-tight);
}

.body-text {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-normal);
  line-height: var(--line-height-relaxed);
  color: var(--color-text-secondary);
}
```

### 3. Motion Physics

Natural feeling animations with spring physics:

```typescript
// Spring configurations for different feels
const springs = {
  // Quick, snappy - for small UI elements
  snappy: { type: 'spring', stiffness: 500, damping: 30 },

  // Smooth, gentle - for larger movements
  gentle: { type: 'spring', stiffness: 120, damping: 14 },

  // Bouncy - for playful elements
  bouncy: { type: 'spring', stiffness: 400, damping: 10 },

  // Stiff - for precise movements
  stiff: { type: 'spring', stiffness: 700, damping: 30 },
};
```

### 4. Design System Adherence

Strict use of design tokens and CSS variables:

```css
:root {
  /* Colors */
  --color-primary: #6366f1;
  --color-primary-hover: #4f46e5;
  --color-surface: #ffffff;
  --color-surface-elevated: #fafafa;

  /* Spacing */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-6: 1.5rem;
  --space-8: 2rem;

  /* Typography */
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);

  /* Transitions */
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  --duration-fast: 150ms;
  --duration-normal: 200ms;
  --duration-slow: 300ms;
}
```

### 5. Responsive Excellence

Beyond "working" on mobile—making it feel native:

```css
/* Mobile-first approach */
.card {
  padding: var(--space-4);
  gap: var(--space-3);
}

@media (min-width: 640px) {
  .card {
    padding: var(--space-6);
    gap: var(--space-4);
  }
}

/* Touch-friendly targets */
.interactive {
  min-height: 44px;
  min-width: 44px;
}

/* Fluid typography */
.heading {
  font-size: clamp(1.5rem, 5vw, 2.5rem);
}
```

## Animation Principles

### 1. Timing & Easing

```css
/* Good: Fast in, slow out (ease-out) for entering */
.entering {
  transition: transform 200ms cubic-bezier(0.16, 1, 0.3, 1);
}

/* Good: Slow in, fast out (ease-in) for exiting */
.exiting {
  transition: transform 150ms cubic-bezier(0.4, 0, 1, 1);
}

/* Bad: Linear (feels mechanical) */
.mechanical {
  transition: transform 200ms linear;
}
```

### 2. Performance-First Animation

```css
/* ✅ GPU-accelerated properties */
.performant {
  transform: translateX(100px);
  opacity: 0.5;
}

/* ❌ Layout-triggering properties */
.janky {
  left: 100px;
  width: 200px;
  margin-left: 50px;
}

/* Enable GPU compositing */
.gpu-layer {
  will-change: transform;
  transform: translateZ(0);
}
```

### 3. Staggered Animations

```typescript
// Staggered list animation
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

<motion.ul variants={container} initial="hidden" animate="show">
  {items.map((item) => (
    <motion.li key={item.id} variants={item}>
      {item.content}
    </motion.li>
  ))}
</motion.ul>
```

## Micro-Interactions

### Button States

```typescript
const Button = ({ children, variant = 'primary', ...props }) => {
  return (
    <motion.button
      className={styles[variant]}
      whileHover={{
        scale: 1.02,
        transition: { duration: 0.2 }
      }}
      whileTap={{
        scale: 0.98,
        transition: { duration: 0.1 }
      }}
      {...props}
    >
      <motion.span
        initial={{ opacity: 0.9 }}
        whileHover={{ opacity: 1 }}
      >
        {children}
      </motion.span>
    </motion.button>
  );
};
```

### Card Hover Effect

```typescript
const Card = ({ children }) => {
  return (
    <motion.article
      className={styles.card}
      whileHover={{
        y: -4,
        boxShadow: '0 12px 24px rgba(0,0,0,0.15)'
      }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 20
      }}
    >
      {children}
    </motion.article>
  );
};
```

### Toggle Switch

```typescript
const Toggle = ({ isOn, onToggle }) => {
  return (
    <motion.button
      onClick={onToggle}
      className={styles.toggle}
      animate={{ backgroundColor: isOn ? '#6366f1' : '#e5e7eb' }}
    >
      <motion.div
        className={styles.knob}
        animate={{ x: isOn ? 20 : 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />
    </motion.button>
  );
};
```

## Loading States

### Skeleton Loading

```typescript
const Skeleton = ({ width, height }) => {
  return (
    <motion.div
      className={styles.skeleton}
      style={{ width, height }}
      animate={{
        backgroundPosition: ['200% 0', '-200% 0'],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: 'linear',
      }}
    />
  );
};
```

```css
.skeleton {
  background: linear-gradient(
    90deg,
    var(--color-surface) 0%,
    var(--color-surface-elevated) 50%,
    var(--color-surface) 100%
  );
  background-size: 200% 100%;
  border-radius: var(--radius-md);
}
```

### Spinner

```typescript
const Spinner = ({ size = 24 }) => {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeDasharray="31.4 31.4"
        strokeLinecap="round"
      />
    </motion.svg>
  );
};
```

## Glassmorphism

```css
.glass-card {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: var(--radius-lg);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

/* Dark mode glass */
.glass-card-dark {
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
```

## Scroll Animations

```typescript
import { useScroll, useTransform, motion } from 'framer-motion';

const ParallaxImage = ({ src, alt }) => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start']
  });

  const y = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [0.6, 1, 0.6]);

  return (
    <div ref={ref} className={styles.imageContainer}>
      <motion.img
        src={src}
        alt={alt}
        style={{ y, opacity }}
      />
    </div>
  );
};
```

## Page Transitions

```typescript
// Layout with AnimatePresence
import { AnimatePresence, motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';

const pageVariants = {
  initial: { opacity: 0, x: -20 },
  enter: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 }
};

const Layout = ({ children }) => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.main
        key={location.pathname}
        variants={pageVariants}
        initial="initial"
        animate="enter"
        exit="exit"
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      >
        {children}
      </motion.main>
    </AnimatePresence>
  );
};
```

## Reduced Motion Support

```typescript
import { useReducedMotion } from 'framer-motion';

const AnimatedComponent = () => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      animate={{ x: 100 }}
      transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.3 }}
    />
  );
};
```

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Animation Checklist

- [ ] Uses CSS `transform` (scale, translate, rotate) or `opacity`
- [ ] Avoids animating layout properties (`width`, `height`, `top`, `left`)
- [ ] Uses `ease-out` for entering and `ease-in` for exiting
- [ ] Timing is appropriate: 150-300ms for UI, 300-500ms for emphasis
- [ ] Respects `prefers-reduced-motion`
- [ ] Animations have purpose (not decorative distraction)
- [ ] Consistent timing across similar interactions
- [ ] No animation on initial page load (unless intentional)

## Performance Checklist

- [ ] 60fps achieved in Chrome DevTools Performance tab
- [ ] `will-change` used sparingly and removed after animation
- [ ] No layout thrashing (batch DOM reads/writes)
- [ ] Images optimized and lazy-loaded
- [ ] CSS containment used where appropriate
- [ ] Animations don't run when tab is inactive

## Commands

```bash
# Analyze bundle size
npx vite-bundle-visualizer

# Test performance
npx lighthouse <url> --only-categories=performance

# Check animation performance
# Chrome DevTools → Performance → Record → Check for frame drops
```

## Resources

- [Motion Documentation](https://motion.dev/docs)
- [Framer Motion](https://www.framer.com/motion/)
- [CSS Easing Functions](https://easings.net/)
- [Google Web Vitals](https://web.dev/vitals/)

## After Polish

> [!IMPORTANT]
> After styling or adding animations:
>
> 1. Verify 60fps performance in DevTools
> 2. Test responsiveness across mobile, tablet, and desktop
> 3. Ensure contrast ratios meet WCAG AA
> 4. Test with `prefers-reduced-motion: reduce`
> 5. Fix ALL lint and type errors in modified files
