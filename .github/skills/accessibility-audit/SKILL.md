---
name: accessibility-audit
description: Perform comprehensive WCAG accessibility audits on web components. Use when auditing accessibility, checking a11y compliance, or reviewing UI for keyboard/screen reader support.
---

# Accessibility Audit Skill

Perform comprehensive WCAG 2.2 accessibility audits on web components and applications.

## Quick Start

```typescript
import axe from 'axe-core';

// Run accessibility audit on entire page
const results = await axe.run();

// Run on specific element
const results = await axe.run(document.querySelector('#main'));

// Run with specific WCAG rules
const results = await axe.run(document, {
  runOnly: { type: 'tag', values: ['wcag2aa', 'wcag21aa'] },
});
```

## Skill Contents

### Documentation

- `docs/wcag-guidelines.md` - WCAG 2.2 levels and success criteria
- `docs/aria-patterns.md` - Common ARIA patterns and roles
- `docs/screen-readers.md` - Screen reader testing guide
- `docs/testing-tools.md` - Accessibility testing tools and setup

### Examples

- `examples/axe-tests.ts` - Vitest integration with axe-core
- `examples/component-audit.tsx` - Accessible React component audit
- `examples/keyboard-navigation.ts` - Keyboard interaction patterns

### Templates

- `templates/audit-report.md` - Accessibility audit report template
- `templates/checklist.md` - WCAG compliance checklist

### Reference

- `REFERENCE.md` - Quick reference cheatsheet

## WCAG 2.2 Compliance Levels

| Level | Target Audience        | Requirements                     |
| ----- | ---------------------- | -------------------------------- |
| A     | Minimum                | Essential accessibility features |
| AA    | Standard (Recommended) | Removes significant barriers     |
| AAA   | Enhanced               | Highest level of accessibility   |

> **Note**: Most organizations target **WCAG 2.2 Level AA** compliance.

## Comprehensive Audit Checklist

### 1. Perceivable

#### Text Alternatives (1.1)

- [ ] Images have descriptive `alt` text
- [ ] Decorative images have `alt=""`
- [ ] Complex images have extended descriptions
- [ ] Icon-only buttons have `aria-label`
- [ ] SVGs have `role="img"` and accessible names

#### Time-Based Media (1.2)

- [ ] Videos have captions
- [ ] Videos have audio descriptions (if needed)
- [ ] Live audio has captions (AA)

#### Adaptable (1.3)

- [ ] Headings follow logical hierarchy (`<h1>` → `<h6>`)
- [ ] Lists use proper `<ul>`, `<ol>`, `<dl>` elements
- [ ] Tables have `<th>` and `scope` attributes
- [ ] Form inputs have associated `<label>` elements
- [ ] Reading order is logical without CSS
- [ ] Instructions don't rely solely on sensory characteristics

#### Distinguishable (1.4)

- [ ] Color is not the only means of conveying information
- [ ] Text contrast ratio ≥ 4.5:1 (normal) or 3:1 (large)
- [ ] UI component contrast ≥ 3:1
- [ ] Text can resize to 200% without loss of content
- [ ] Images of text are avoided (except logos)
- [ ] Content reflows at 320px width without horizontal scroll
- [ ] Non-text contrast meets 3:1 ratio
- [ ] Text spacing can be adjusted without breaking layout

### 2. Operable

#### Keyboard Accessible (2.1)

- [ ] All functionality available via keyboard
- [ ] No keyboard traps (except modals with escape)
- [ ] Character key shortcuts can be disabled/remapped

#### Enough Time (2.2)

- [ ] Time limits can be adjusted or extended
- [ ] Moving content can be paused/stopped
- [ ] No content flashes more than 3 times per second

#### Navigable (2.4)

- [ ] Skip links provided for repeated blocks
- [ ] Pages have descriptive `<title>`
- [ ] Focus order is logical
- [ ] Link purpose is clear from text (or context)
- [ ] Multiple ways to navigate site (search, sitemap, nav)
- [ ] Headings and labels are descriptive
- [ ] Focus indicator is visible (enhanced in 2.2)

#### Input Modalities (2.5)

- [ ] Pointer gestures have single-pointer alternatives
- [ ] Touch targets are at least 24×24px (44×44px recommended)
- [ ] Dragging has non-dragging alternative
- [ ] Motion actuation can be disabled

### 3. Understandable

#### Readable (3.1)

- [ ] Page language declared (`<html lang="en">`)
- [ ] Language changes marked (`<span lang="fr">`)

#### Predictable (3.2)

- [ ] Focus doesn't trigger unexpected changes
- [ ] Input doesn't trigger unexpected changes
- [ ] Navigation is consistent across pages
- [ ] Components are identified consistently

#### Input Assistance (3.3)

- [ ] Errors are identified and described
- [ ] Labels or instructions provided for inputs
- [ ] Error suggestions are provided
- [ ] Error prevention for legal/financial data
- [ ] Redundant entry assistance (new in 2.2)
- [ ] Accessible authentication (new in 2.2)

### 4. Robust

#### Compatible (4.1)

- [ ] HTML validates (no duplicate IDs)
- [ ] Name, role, value available for custom controls
- [ ] Status messages use `aria-live` regions

## Automated Testing Setup

### Vitest + axe-core

```typescript
// vitest.setup.ts
import 'vitest-axe/extend-expect';

// Component test
import { render } from '@testing-library/react';
import { axe } from 'vitest-axe';

test('component is accessible', async () => {
  const { container } = render(<MyComponent />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

### Playwright + axe-core

```typescript
// e2e/accessibility.spec.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('page has no accessibility violations', async ({ page }) => {
  await page.goto('/');

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();

  expect(results.violations).toEqual([]);
});
```

## Common ARIA Patterns

### Button

```html
<!-- Native button (preferred) -->
<button type="button">Click me</button>

<!-- Custom button -->
<div role="button" tabindex="0" aria-pressed="false">Toggle</div>
```

### Dialog/Modal

```html
<div role="dialog" aria-modal="true" aria-labelledby="dialog-title">
  <h2 id="dialog-title">Confirm Action</h2>
  <p>Are you sure you want to proceed?</p>
  <button>Confirm</button>
  <button>Cancel</button>
</div>
```

### Tabs

```html
<div role="tablist" aria-label="Main sections">
  <button role="tab" aria-selected="true" aria-controls="panel-1">Tab 1</button>
  <button
    role="tab"
    aria-selected="false"
    aria-controls="panel-2"
    tabindex="-1"
  >
    Tab 2
  </button>
</div>
<div role="tabpanel" id="panel-1" aria-labelledby="tab-1">Content 1</div>
<div role="tabpanel" id="panel-2" aria-labelledby="tab-2" hidden>Content 2</div>
```

### Live Regions

```html
<!-- Polite announcement (waits for silence) -->
<div aria-live="polite" aria-atomic="true">3 items added to cart</div>

<!-- Assertive announcement (interrupts) -->
<div aria-live="assertive" role="alert">Error: Invalid email address</div>

<!-- Status message -->
<div role="status">Loading complete</div>
```

## Keyboard Navigation Requirements

| Component   | Keys                  | Behavior                |
| ----------- | --------------------- | ----------------------- |
| Button      | `Enter`, `Space`      | Activate                |
| Link        | `Enter`               | Navigate                |
| Checkbox    | `Space`               | Toggle                  |
| Radio Group | `←` `→` `↑` `↓`       | Move selection          |
| Tabs        | `←` `→`               | Switch tabs             |
| Menu        | `↑` `↓` `Enter` `Esc` | Navigate, select, close |
| Modal       | `Tab` `Esc`           | Trap focus, close       |
| Combobox    | `↑` `↓` `Enter` `Esc` | Navigate, select, close |
| Slider      | `←` `→`               | Adjust value            |

## Color Contrast Requirements

| Element Type                    | AA Ratio | AAA Ratio |
| ------------------------------- | -------- | --------- |
| Normal text (<18px)             | 4.5:1    | 7:1       |
| Large text (≥18px or 14px bold) | 3:1      | 4.5:1     |
| UI components & graphics        | 3:1      | N/A       |
| Focus indicators                | 3:1      | N/A       |

### Checking Contrast

```javascript
// Using axe-core
axe.run(document, {
  rules: { 'color-contrast': { enabled: true } },
});
```

```css
/* CSS for ensuring focus visibility */
:focus-visible {
  outline: 2px solid #0066cc;
  outline-offset: 2px;
}
```

## Audit Output Format

When asked to "audit accessibility", output a report:

```markdown
# Accessibility Audit Report

**URL/Component**: [Identifier]
**Date**: [YYYY-MM-DD]
**Auditor**: [Name]
**WCAG Version**: 2.2 Level AA
**Tools Used**: axe-core, WAVE, VoiceOver/NVDA

## Executive Summary

- **Total Issues**: X
- **Critical**: X | **Serious**: X | **Moderate**: X | **Minor**: X
- **Compliance Status**: Pass / Fail / Partial

## Issues Found

### Issue 1: [WCAG Criterion] - [Impact Level]

**Element**: `<selector or description>`
**WCAG**: X.X.X (Level A/AA/AAA)
**Impact**: Critical / Serious / Moderate / Minor

**Problem**:
[Description of the accessibility barrier]

**Affected Users**:

- [ ] Screen reader users
- [ ] Keyboard users
- [ ] Low vision users
- [ ] Cognitive disabilities

**Remediation**:

- <div onclick="submit()">Submit</div>

* <button type="submit">Submit</button>

**Resources**:

- [Link to WCAG success criterion]
- [Link to technique]

## Testing Results

### Automated Testing

- axe-core: X violations
- Lighthouse: XX% accessibility score

### Manual Testing

- [ ] Keyboard navigation tested
- [ ] Screen reader tested (VoiceOver/NVDA)
- [ ] Zoom 200% tested
- [ ] Color contrast verified
- [ ] Motion preferences tested

## Recommendations

1. [Priority 1 fix]
2. [Priority 2 fix]
3. [Priority 3 fix]
```

## Commands

```bash
# Run automated accessibility tests
npm run test:a11y

# Run Lighthouse accessibility audit
npx lighthouse <url> --only-categories=accessibility

# Generate detailed report
npm run audit:a11y -- --output=report.json
```

## Screen Reader Testing

### macOS VoiceOver

1. Enable: `Cmd + F5`
2. Navigate: `Ctrl + Option + Arrow Keys`
3. Read all: `Ctrl + Option + A`
4. Rotor: `Ctrl + Option + U`

### Windows NVDA

1. Enable: `Ctrl + Alt + N`
2. Navigate: `Tab`, `Arrow Keys`
3. Read all: `NVDA + Down Arrow`
4. Elements list: `NVDA + F7`

### Testing Checklist

- [ ] All content is announced
- [ ] Interactive elements are identified
- [ ] Form labels are associated
- [ ] Error messages are announced
- [ ] Dynamic content updates are communicated

## Resources

- [WCAG 2.2 Guidelines](https://www.w3.org/TR/WCAG22/)
- [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/)
- [axe-core Documentation](https://github.com/dequelabs/axe-core)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

## After Audit

> [!IMPORTANT]
> After completing the audit, you MUST:
>
> 1. Fix all critical and serious issues
> 2. Create remediation plan for moderate/minor issues
> 3. Run automated tests: `npm run test:a11y`
> 4. Verify fixes with manual testing
> 5. Document any exceptions with justification
