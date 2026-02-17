# Design Tokens Reference

## What Are Design Tokens?

Design tokens are the atoms of your design system—named entities that store visual design values. They create a shared language between design and development.

## Token Categories

### Color Tokens

```css
:root {
  /* Primitives (don't use directly) */
  --blue-50: #eff6ff;
  --blue-100: #dbeafe;
  --blue-500: #3b82f6;
  --blue-600: #2563eb;
  --blue-700: #1d4ed8;

  /* Semantic (use these) */
  --color-primary: var(--blue-600);
  --color-primary-hover: var(--blue-700);
  --color-primary-light: var(--blue-100);

  --color-text: #1f2937;
  --color-text-muted: #6b7280;
  --color-text-inverse: #ffffff;

  --color-background: #ffffff;
  --color-background-subtle: #f9fafb;
  --color-background-muted: #f3f4f6;

  --color-border: #e5e7eb;
  --color-border-strong: #d1d5db;

  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  --color-info: #3b82f6;
}

/* Dark mode */
[data-theme='dark'] {
  --color-text: #f9fafb;
  --color-text-muted: #9ca3af;
  --color-background: #111827;
  --color-background-subtle: #1f2937;
  --color-border: #374151;
}
```

### Spacing Tokens

```css
:root {
  --space-0: 0;
  --space-1: 0.25rem; /* 4px */
  --space-2: 0.5rem; /* 8px */
  --space-3: 0.75rem; /* 12px */
  --space-4: 1rem; /* 16px */
  --space-5: 1.25rem; /* 20px */
  --space-6: 1.5rem; /* 24px */
  --space-8: 2rem; /* 32px */
  --space-10: 2.5rem; /* 40px */
  --space-12: 3rem; /* 48px */
  --space-16: 4rem; /* 64px */
  --space-20: 5rem; /* 80px */
  --space-24: 6rem; /* 96px */
}
```

### Typography Tokens

```css
:root {
  /* Font families */
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;

  /* Font sizes */
  --text-xs: 0.75rem; /* 12px */
  --text-sm: 0.875rem; /* 14px */
  --text-base: 1rem; /* 16px */
  --text-lg: 1.125rem; /* 18px */
  --text-xl: 1.25rem; /* 20px */
  --text-2xl: 1.5rem; /* 24px */
  --text-3xl: 1.875rem; /* 30px */
  --text-4xl: 2.25rem; /* 36px */

  /* Font weights */
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;

  /* Line heights */
  --leading-none: 1;
  --leading-tight: 1.25;
  --leading-snug: 1.375;
  --leading-normal: 1.5;
  --leading-relaxed: 1.625;

  /* Letter spacing */
  --tracking-tight: -0.025em;
  --tracking-normal: 0;
  --tracking-wide: 0.025em;
}
```

### Size Tokens

```css
:root {
  /* Border radius */
  --radius-none: 0;
  --radius-sm: 0.125rem; /* 2px */
  --radius-md: 0.375rem; /* 6px */
  --radius-lg: 0.5rem; /* 8px */
  --radius-xl: 0.75rem; /* 12px */
  --radius-2xl: 1rem; /* 16px */
  --radius-full: 9999px;

  /* Border width */
  --border-0: 0;
  --border-1: 1px;
  --border-2: 2px;
  --border-4: 4px;
}
```

### Shadow Tokens

```css
:root {
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --shadow-lg:
    0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  --shadow-xl:
    0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
  --shadow-inner: inset 0 2px 4px 0 rgb(0 0 0 / 0.05);
}
```

### Motion Tokens

```css
:root {
  /* Duration */
  --duration-instant: 100ms;
  --duration-fast: 200ms;
  --duration-normal: 300ms;
  --duration-slow: 500ms;

  /* Easing */
  --ease-linear: linear;
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

### Z-Index Tokens

```css
:root {
  --z-dropdown: 100;
  --z-sticky: 200;
  --z-fixed: 300;
  --z-modal-backdrop: 400;
  --z-modal: 500;
  --z-popover: 600;
  --z-tooltip: 700;
  --z-toast: 800;
}
```

## Using Tokens

```css
/* Component using tokens */
.button {
  padding: var(--space-2) var(--space-4);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  border-radius: var(--radius-md);
  background: var(--color-primary);
  color: var(--color-text-inverse);
  box-shadow: var(--shadow-sm);
  transition: all var(--duration-fast) var(--ease-out);
}

.button:hover {
  background: var(--color-primary-hover);
  box-shadow: var(--shadow-md);
}
```

## TypeScript Integration

```typescript
// tokens.ts
export const tokens = {
  colors: {
    primary: 'var(--color-primary)',
    background: 'var(--color-background)',
  },
  spacing: {
    sm: 'var(--space-2)',
    md: 'var(--space-4)',
    lg: 'var(--space-6)',
  },
  duration: {
    fast: 'var(--duration-fast)',
    normal: 'var(--duration-normal)',
  },
} as const;

// Usage with styled-components or similar
const Button = styled.button`
  padding: ${tokens.spacing.sm} ${tokens.spacing.md};
  background: ${tokens.colors.primary};
  transition: all ${tokens.duration.fast} ease-out;
`;
```
