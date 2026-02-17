# Animation Principles

## The 12 Principles of Animation

Disney's 12 principles adapted for UI:

### 1. Squash and Stretch

Volume remains constant during deformation. In UI, this translates to buttons that compress on press.

```css
.button:active {
  transform: scale(0.95);
}
```

### 2. Anticipation

Prepare users for an action with a small reverse movement.

```css
.card:hover {
  animation: anticipate 0.3s ease-out;
}

@keyframes anticipate {
  0% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(2px);
  }
  100% {
    transform: translateY(-4px);
  }
}
```

### 3. Staging

Direct attention to what matters. Use motion to guide focus.

### 4. Straight Ahead vs Pose to Pose

- **Straight ahead**: Physics-based animations (springs)
- **Pose to pose**: Keyframe animations with defined states

### 5. Follow Through and Overlapping

Elements don't stop at the same time. Child elements lag behind.

```css
.parent {
  transition: transform 0.3s ease;
}

.child {
  transition: transform 0.3s ease 0.05s; /* slight delay */
}
```

### 6. Slow In and Slow Out (Easing)

Natural motion accelerates and decelerates.

```css
/* Never use linear for UI motion */
transition: transform 0.3s ease-out;

/* Custom cubic-bezier for specific feels */
transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
```

### 7. Arcs

Natural movement follows curved paths, not straight lines.

```css
@keyframes drop {
  0% {
    transform: translate(0, 0);
  }
  100% {
    transform: translate(100px, 200px);
  }
}

/* Better with motion path */
.element {
  offset-path: path('M 0 0 Q 50 -20 100 200');
  animation: move 0.5s ease-in-out;
}

@keyframes move {
  to {
    offset-distance: 100%;
  }
}
```

### 8. Secondary Action

Supporting animations that enhance the primary action.

```css
.success-message {
  animation: slideIn 0.3s ease-out;
}

.success-icon {
  animation: bounceIn 0.4s ease-out 0.2s both;
}
```

### 9. Timing

Duration affects perception:

- **Fast (100-200ms)**: Instant feedback, micro-interactions
- **Medium (200-400ms)**: State changes, small transitions
- **Slow (400-700ms)**: Page transitions, complex animations

### 10. Exaggeration

Amplify to clarify, but stay consistent with your design language.

### 11. Solid Drawing

Maintain visual consistency. Elements should have clear form.

### 12. Appeal

Animation should feel polished and intentional, not gratuitous.

## Easing Functions

### Standard Easings

| Easing      | Use Case           | CSS                            |
| ----------- | ------------------ | ------------------------------ |
| ease-out    | Entering elements  | `cubic-bezier(0, 0, 0.2, 1)`   |
| ease-in     | Exiting elements   | `cubic-bezier(0.4, 0, 1, 1)`   |
| ease-in-out | On-screen movement | `cubic-bezier(0.4, 0, 0.2, 1)` |
| linear      | Opacity changes    | `linear`                       |

### Spring Physics

Springs feel more natural than bezier curves for interactive elements.

```typescript
// Motion/Framer Motion spring
const springConfig = {
  type: 'spring',
  stiffness: 400, // How "tight" the spring is
  damping: 30, // How quickly it settles
  mass: 1, // Weight of the object
};
```

| Feel   | Stiffness | Damping |
| ------ | --------- | ------- |
| Snappy | 500       | 30      |
| Bouncy | 300       | 10      |
| Smooth | 200       | 20      |
| Heavy  | 100       | 30      |

## Motion Tokens

```css
:root {
  /* Duration */
  --duration-instant: 100ms;
  --duration-fast: 200ms;
  --duration-normal: 300ms;
  --duration-slow: 500ms;

  /* Easing */
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

## Reduced Motion

Always respect user preferences:

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

```typescript
// JavaScript check
const prefersReducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)',
).matches;
```
