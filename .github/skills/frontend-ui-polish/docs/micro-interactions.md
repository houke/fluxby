# Micro-interactions Guide

## What Are Micro-interactions?

Micro-interactions are small, functional animations that provide feedback, guide users, and add delight. They communicate status changes and acknowledge user actions.

## Categories

### 1. Feedback Animations

#### Button Press

```css
.button {
  transition:
    transform 0.1s ease-out,
    box-shadow 0.1s ease-out;
}

.button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.button:active {
  transform: translateY(0) scale(0.98);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}
```

#### Toggle Switch

```tsx
const Toggle = ({ checked, onChange }) => (
  <motion.button
    onClick={() => onChange(!checked)}
    className='toggle'
    animate={{ backgroundColor: checked ? '#10b981' : '#d1d5db' }}
    transition={{ duration: 0.2 }}
  >
    <motion.div
      className='toggle-thumb'
      animate={{ x: checked ? 20 : 0 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
    />
  </motion.button>
);
```

#### Checkbox Check

```tsx
const Checkbox = ({ checked }) => (
  <motion.div className='checkbox'>
    <motion.svg viewBox='0 0 24 24'>
      <motion.path
        d='M5 13l4 4L19 7'
        fill='none'
        stroke='currentColor'
        strokeWidth={3}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: checked ? 1 : 0 }}
        transition={{ duration: 0.2 }}
      />
    </motion.svg>
  </motion.div>
);
```

### 2. Loading States

#### Pulse Loader

```css
@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.loading-dot {
  animation: pulse 1.5s ease-in-out infinite;
}

.loading-dot:nth-child(2) {
  animation-delay: 0.2s;
}
.loading-dot:nth-child(3) {
  animation-delay: 0.4s;
}
```

#### Skeleton Shimmer

```css
.skeleton {
  background: linear-gradient(
    90deg,
    var(--color-background-muted) 25%,
    var(--color-background-subtle) 50%,
    var(--color-background-muted) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
```

#### Progress Indicator

```tsx
const Progress = ({ value }) => (
  <div className='progress-track'>
    <motion.div
      className='progress-fill'
      initial={{ width: 0 }}
      animate={{ width: `${value}%` }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    />
  </div>
);
```

### 3. State Changes

#### Like Button

```tsx
const LikeButton = ({ liked, onLike }) => (
  <motion.button onClick={onLike} whileTap={{ scale: 0.9 }}>
    <motion.svg
      animate={{
        scale: liked ? [1, 1.3, 1] : 1,
        color: liked ? '#ef4444' : '#9ca3af',
      }}
      transition={{ duration: 0.3 }}
    >
      <HeartIcon filled={liked} />
    </motion.svg>
  </motion.button>
);
```

#### Save Button States

```tsx
const SaveButton = ({ status }) => {
  const variants = {
    idle: { scale: 1, backgroundColor: '#3b82f6' },
    saving: { scale: 0.95, backgroundColor: '#6b7280' },
    saved: { scale: [1, 1.1, 1], backgroundColor: '#10b981' },
  };

  return (
    <motion.button
      animate={status}
      variants={variants}
      transition={{ duration: 0.2 }}
    >
      {status === 'saving'
        ? 'Saving...'
        : status === 'saved'
          ? 'Saved!'
          : 'Save'}
    </motion.button>
  );
};
```

### 4. Navigation

#### Menu Reveal

```tsx
const Menu = ({ isOpen }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.nav
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
      >
        {items.map((item, i) => (
          <motion.a
            key={item.href}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            {item.label}
          </motion.a>
        ))}
      </motion.nav>
    )}
  </AnimatePresence>
);
```

#### Tab Indicator

```tsx
const TabIndicator = ({ activeIndex, tabs }) => {
  const width = 100 / tabs.length;

  return (
    <motion.div
      className='tab-indicator'
      animate={{
        x: `${activeIndex * 100}%`,
        width: `${width}%`,
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    />
  );
};
```

### 5. Form Interactions

#### Input Focus

```css
.input {
  border: 2px solid var(--color-border);
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}

.input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-light);
}
```

#### Validation Feedback

```tsx
const Input = ({ error }) => (
  <motion.div
    animate={error ? { x: [-4, 4, -4, 4, 0] } : {}}
    transition={{ duration: 0.4 }}
  >
    <input className={error ? 'error' : ''} />
    <AnimatePresence>
      {error && (
        <motion.span
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className='error-message'
        >
          {error}
        </motion.span>
      )}
    </AnimatePresence>
  </motion.div>
);
```

### 6. Tooltips & Popovers

#### Tooltip

```tsx
const Tooltip = ({ children, content }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            role='tooltip'
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className='tooltip'
          >
            {content}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
```

## Best Practices

1. **Keep it subtle**: Micro-interactions should enhance, not distract
2. **Be consistent**: Same action = same animation across the app
3. **Consider timing**: Fast for feedback (100-200ms), slower for emphasis (300-500ms)
4. **Respect preferences**: Always support reduced motion
5. **Purposeful motion**: Every animation should have a reason
