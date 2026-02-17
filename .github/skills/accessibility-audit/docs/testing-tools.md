# Accessibility Testing Tools

## Automated Testing

### axe-core

The industry standard for automated accessibility testing.

```bash
npm install -D @axe-core/playwright @axe-core/react
```

#### Playwright Integration

```typescript
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('should not have accessibility violations', async ({ page }) => {
  await page.goto('/');

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();

  expect(results.violations).toEqual([]);
});
```

#### React Integration

```typescript
import React from 'react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { render } from '@testing-library/react';

expect.extend(toHaveNoViolations);

test('Button is accessible', async () => {
  const { container } = render(<Button>Click me</Button>);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

### Lighthouse

Google's automated auditing tool.

```bash
# CLI
npx lighthouse https://example.com --only-categories=accessibility

# CI Integration
npm install -D lighthouse
```

### pa11y

Command-line accessibility testing.

```bash
npm install -g pa11y

# Test single page
pa11y https://example.com

# Test with specific standard
pa11y --standard WCAG2AA https://example.com
```

## Browser Extensions

| Tool                   | Browser               | Features              |
| ---------------------- | --------------------- | --------------------- |
| axe DevTools           | Chrome, Firefox, Edge | Comprehensive testing |
| WAVE                   | Chrome, Firefox       | Visual feedback       |
| Accessibility Insights | Chrome, Edge          | Assessment workflow   |
| Lighthouse             | Chrome                | Built-in audits       |

## Screen Readers

### Testing Matrix

| Screen Reader | OS        | Browser        | Usage |
| ------------- | --------- | -------------- | ----- |
| VoiceOver     | macOS/iOS | Safari         | ~25%  |
| NVDA          | Windows   | Firefox/Chrome | ~40%  |
| JAWS          | Windows   | Chrome/Edge    | ~30%  |
| TalkBack      | Android   | Chrome         | ~5%   |

### VoiceOver Commands (macOS)

```
Enable: Cmd + F5
Rotor: VO + U
Next item: VO + Right Arrow
Activate: VO + Space
Read all: VO + A
```

### NVDA Commands (Windows)

```
Enable: Ctrl + Alt + N
Elements list: NVDA + F7
Next item: Down Arrow
Activate: Enter
Read all: NVDA + Down Arrow
```

## Color Contrast Tools

### Automated

- **WebAIM Contrast Checker**: https://webaim.org/resources/contrastchecker/
- **Colour Contrast Analyser**: Desktop app for checking contrast

### Browser DevTools

```
Chrome: DevTools > Elements > Styles > Color picker
Firefox: DevTools > Accessibility > Check for issues
```

### Contrast Requirements

| Element            | Ratio | Example          |
| ------------------ | ----- | ---------------- |
| Normal text        | 4.5:1 | #767676 on white |
| Large text (18pt+) | 3:1   | #949494 on white |
| UI components      | 3:1   | Buttons, inputs  |

## Keyboard Testing

### Manual Testing Checklist

1. Tab through entire page
2. Verify focus is visible
3. Check focus order is logical
4. Test all interactive elements
5. Verify escape closes modals
6. Check skip links work

### Focus Visibility Test

```css
/* If this shows nothing, focus is hidden */
*:focus {
  outline: 3px solid red !important;
}
```

## CI/CD Integration

### GitHub Actions

```yaml
name: Accessibility Tests
on: [push, pull_request]

jobs:
  a11y:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run build
      - run: npm run test:a11y
```

### Pre-commit Hook

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run lint:a11y"
    }
  }
}
```
