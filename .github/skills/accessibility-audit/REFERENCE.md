# Accessibility Quick Reference

## ARIA Roles

### Landmark Roles

| Role            | HTML Equivalent | Usage                |
| --------------- | --------------- | -------------------- |
| `banner`        | `<header>`      | Site header          |
| `navigation`    | `<nav>`         | Navigation links     |
| `main`          | `<main>`        | Main content         |
| `complementary` | `<aside>`       | Supporting content   |
| `contentinfo`   | `<footer>`      | Site footer          |
| `search`        | -               | Search functionality |
| `form`          | `<form>`        | Form region          |
| `region`        | `<section>`     | Generic landmark     |

### Widget Roles

| Role          | Description        | Required Attributes                               |
| ------------- | ------------------ | ------------------------------------------------- |
| `button`      | Clickable button   | -                                                 |
| `checkbox`    | Toggleable option  | `aria-checked`                                    |
| `dialog`      | Modal dialog       | `aria-modal`, `aria-labelledby`                   |
| `listbox`     | List of options    | `aria-activedescendant`                           |
| `menu`        | Menu of actions    | -                                                 |
| `menuitem`    | Item in menu       | -                                                 |
| `progressbar` | Progress indicator | `aria-valuenow`, `aria-valuemin`, `aria-valuemax` |
| `radio`       | Radio button       | `aria-checked`                                    |
| `slider`      | Value selector     | `aria-valuenow`, `aria-valuemin`, `aria-valuemax` |
| `switch`      | On/off toggle      | `aria-checked`                                    |
| `tab`         | Tab in tablist     | `aria-selected`, `aria-controls`                  |
| `tabpanel`    | Tab panel          | `aria-labelledby`                                 |
| `textbox`     | Text input         | -                                                 |
| `tooltip`     | Tooltip content    | -                                                 |
| `tree`        | Tree structure     | -                                                 |
| `treeitem`    | Item in tree       | `aria-expanded` (if expandable)                   |

## ARIA States & Properties

### Common States

```html
aria-checked="true|false|mixed"
<!-- Checkbox/radio state -->
aria-disabled="true|false"
<!-- Disabled state -->
aria-expanded="true|false"
<!-- Expandable state -->
aria-hidden="true|false"
<!-- Hidden from AT -->
aria-invalid="true|false|grammar|spelling"
<!-- Validation state -->
aria-pressed="true|false|mixed"
<!-- Toggle button state -->
aria-selected="true|false"
<!-- Selection state -->
```

### Common Properties

```html
aria-label="Label text"
<!-- Accessible name -->
aria-labelledby="id1 id2"
<!-- Reference to labeling element -->
aria-describedby="id"
<!-- Reference to description -->
aria-controls="id"
<!-- Controls another element -->
aria-owns="id"
<!-- Owns another element -->
aria-live="polite|assertive|off"
<!-- Live region -->
aria-atomic="true|false"
<!-- Announce whole region -->
aria-relevant="additions|removals|text|all"
<!-- What changes to announce -->
aria-haspopup="true|menu|listbox|tree|grid|dialog"
<!-- Has popup -->
aria-current="page|step|location|date|time|true|false"
<!-- Current item -->
aria-errormessage="id"
<!-- Error message reference -->
```

## Keyboard Shortcuts

### Global

| Key           | Action                             |
| ------------- | ---------------------------------- |
| `Tab`         | Move to next focusable element     |
| `Shift + Tab` | Move to previous focusable element |
| `Enter`       | Activate link/button               |
| `Space`       | Activate button, toggle checkbox   |
| `Escape`      | Close dialog/menu                  |

### Within Components

| Component | Key             | Action            |
| --------- | --------------- | ----------------- |
| Menu      | `↑` `↓`         | Navigate items    |
| Menu      | `Enter`         | Select item       |
| Menu      | `Esc`           | Close menu        |
| Tabs      | `←` `→`         | Switch tabs       |
| Tabs      | `Home` `End`    | First/last tab    |
| Tree      | `↑` `↓`         | Navigate items    |
| Tree      | `←` `→`         | Collapse/expand   |
| Grid      | `↑` `↓` `←` `→` | Navigate cells    |
| Slider    | `←` `→`         | Decrease/increase |
| Slider    | `Home` `End`    | Min/max value     |

## Focus Management

### Focus Trap (Modal)

```javascript
// Trap focus within modal
const modal = document.querySelector('[role="dialog"]');
const focusableElements = modal.querySelectorAll(
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
);
const firstFocusable = focusableElements[0];
const lastFocusable = focusableElements[focusableElements.length - 1];

modal.addEventListener('keydown', (e) => {
  if (e.key === 'Tab') {
    if (e.shiftKey && document.activeElement === firstFocusable) {
      e.preventDefault();
      lastFocusable.focus();
    } else if (!e.shiftKey && document.activeElement === lastFocusable) {
      e.preventDefault();
      firstFocusable.focus();
    }
  }
});
```

### Roving Tabindex

```javascript
// For toolbar, menu, tablist
const items = document.querySelectorAll('[role="tab"]');
let currentIndex = 0;

items.forEach((item, index) => {
  item.tabIndex = index === 0 ? 0 : -1;
  item.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') {
      items[currentIndex].tabIndex = -1;
      currentIndex = (currentIndex + 1) % items.length;
      items[currentIndex].tabIndex = 0;
      items[currentIndex].focus();
    }
    // Similar for ArrowLeft
  });
});
```

## Color Contrast

### Minimum Ratios (WCAG AA)

| Element                         | Ratio |
| ------------------------------- | ----- |
| Normal text                     | 4.5:1 |
| Large text (18px+ or 14px bold) | 3:1   |
| UI components                   | 3:1   |
| Graphical objects               | 3:1   |

### Enhanced Ratios (WCAG AAA)

| Element     | Ratio |
| ----------- | ----- |
| Normal text | 7:1   |
| Large text  | 4.5:1 |

### CSS for Contrast

```css
/* Ensure sufficient contrast */
:root {
  --text-primary: #1a1a1a; /* 15:1 on white */
  --text-secondary: #595959; /* 7:1 on white */
  --text-disabled: #767676; /* 4.5:1 on white */
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  :root {
    --text-secondary: var(--text-primary);
  }
}
```

## Motion & Animation

```css
/* Respect reduced motion preference */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

```javascript
// JavaScript detection
const prefersReducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)',
).matches;

if (!prefersReducedMotion) {
  // Run animations
}
```

## Testing Commands

```bash
# axe-core CLI
npx axe <url>

# Lighthouse accessibility audit
npx lighthouse <url> --only-categories=accessibility --output=json

# Pa11y CLI
npx pa11y <url>

# Check specific WCAG level
npx axe <url> --tags wcag2aa,wcag21aa
```

## Common Fixes

### Missing Form Labels

```html
<!-- Bad -->
<input type="email" placeholder="Email" />

<!-- Good -->
<label for="email">Email</label>
<input type="email" id="email" />

<!-- Also Good (visually hidden label) -->
<label for="email" class="sr-only">Email</label>
<input type="email" id="email" placeholder="Email" />
```

### Missing Button Text

```html
<!-- Bad -->
<button><svg>...</svg></button>

<!-- Good -->
<button aria-label="Close menu"><svg aria-hidden="true">...</svg></button>

<!-- Also Good -->
<button>
  <svg aria-hidden="true">...</svg>
  <span class="sr-only">Close menu</span>
</button>
```

### Missing Image Alt

```html
<!-- Informative image -->
<img src="chart.png" alt="Sales increased 50% in Q4" />

<!-- Decorative image -->
<img src="decoration.png" alt="" />

<!-- Complex image -->
<figure>
  <img src="diagram.png" alt="System architecture diagram" />
  <figcaption>
    <details>
      <summary>Detailed description</summary>
      <p>The system consists of...</p>
    </details>
  </figcaption>
</figure>
```

### Screen Reader Only Class

```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.sr-only-focusable:focus {
  position: static;
  width: auto;
  height: auto;
  margin: 0;
  overflow: visible;
  clip: auto;
  white-space: normal;
}
```

## axe-core Rule Tags

| Tag             | Description                         |
| --------------- | ----------------------------------- |
| `wcag2a`        | WCAG 2.0 Level A                    |
| `wcag2aa`       | WCAG 2.0 Level AA                   |
| `wcag21a`       | WCAG 2.1 Level A                    |
| `wcag21aa`      | WCAG 2.1 Level AA                   |
| `wcag22aa`      | WCAG 2.2 Level AA                   |
| `best-practice` | Common accessibility best practices |
| `experimental`  | Experimental rules                  |
| `cat.forms`     | Form-related rules                  |
| `cat.keyboard`  | Keyboard accessibility              |
| `cat.color`     | Color contrast                      |
| `cat.aria`      | ARIA usage                          |
