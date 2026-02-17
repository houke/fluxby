# ARIA Patterns Reference

## ARIA Fundamentals

### When to Use ARIA

1. **First Rule**: Don't use ARIA if native HTML works
2. **Second Rule**: Don't change native semantics unnecessarily
3. **Third Rule**: All interactive ARIA controls must be keyboard accessible
4. **Fourth Rule**: Don't hide focusable elements
5. **Fifth Rule**: Interactive elements must have accessible names

### ARIA Categories

| Category   | Purpose                | Examples                         |
| ---------- | ---------------------- | -------------------------------- |
| Roles      | Define element type    | `role="button"`, `role="dialog"` |
| States     | Current condition      | `aria-expanded`, `aria-checked`  |
| Properties | Static characteristics | `aria-label`, `aria-describedby` |

## Common Widget Patterns

### Accordion

```html
<div class="accordion">
  <h3>
    <button aria-expanded="false" aria-controls="panel-1" id="accordion-1">
      Section 1
    </button>
  </h3>
  <div id="panel-1" role="region" aria-labelledby="accordion-1" hidden>
    Panel content
  </div>
</div>
```

**Keyboard**: Enter/Space to toggle, Arrow keys between headers

### Modal Dialog

```html
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="dialog-title"
  aria-describedby="dialog-desc"
>
  <h2 id="dialog-title">Confirm Action</h2>
  <p id="dialog-desc">Are you sure you want to proceed?</p>
  <button>Cancel</button>
  <button>Confirm</button>
</div>
```

**Requirements**:

- Focus moves to dialog on open
- Focus trapped inside dialog
- Escape closes dialog
- Focus returns to trigger on close

### Tabs

```html
<div class="tabs">
  <div role="tablist" aria-label="Main tabs">
    <button role="tab" aria-selected="true" aria-controls="panel-1" id="tab-1">
      Tab 1
    </button>
    <button
      role="tab"
      aria-selected="false"
      aria-controls="panel-2"
      id="tab-2"
      tabindex="-1"
    >
      Tab 2
    </button>
  </div>
  <div role="tabpanel" id="panel-1" aria-labelledby="tab-1">
    Panel 1 content
  </div>
  <div role="tabpanel" id="panel-2" aria-labelledby="tab-2" hidden>
    Panel 2 content
  </div>
</div>
```

**Keyboard**: Arrow keys between tabs, Tab into panel

### Menu

```html
<nav aria-label="Main">
  <button aria-expanded="false" aria-haspopup="true" aria-controls="menu">
    Menu
  </button>
  <ul role="menu" id="menu" hidden>
    <li role="menuitem"><a href="/">Home</a></li>
    <li role="menuitem"><a href="/about">About</a></li>
    <li role="menuitem"><a href="/contact">Contact</a></li>
  </ul>
</nav>
```

**Keyboard**: Arrow keys to navigate, Enter to activate, Escape to close

### Combobox (Autocomplete)

```html
<label for="search">Search</label>
<div class="combobox">
  <input
    type="text"
    id="search"
    role="combobox"
    aria-expanded="false"
    aria-autocomplete="list"
    aria-controls="listbox"
    aria-activedescendant=""
  />
  <ul role="listbox" id="listbox" hidden>
    <li role="option" id="opt-1">Option 1</li>
    <li role="option" id="opt-2">Option 2</li>
  </ul>
</div>
```

### Toggle Button

```html
<button
  aria-pressed="false"
  onclick="this.setAttribute('aria-pressed', 
    this.getAttribute('aria-pressed') === 'true' ? 'false' : 'true')"
>
  Dark Mode
</button>
```

### Progress Bar

```html
<!-- Determinate -->
<div
  role="progressbar"
  aria-valuenow="50"
  aria-valuemin="0"
  aria-valuemax="100"
  aria-label="Upload progress"
>
  50%
</div>

<!-- Indeterminate -->
<div role="progressbar" aria-label="Loading">Loading...</div>
```

## Live Regions

### Status Messages

```html
<!-- Polite: Announced when user is idle -->
<div role="status" aria-live="polite">3 results found</div>

<!-- Assertive: Announced immediately -->
<div role="alert" aria-live="assertive">Error: Form submission failed</div>

<!-- Atomic: Announces entire region -->
<div aria-live="polite" aria-atomic="true">Page 2 of 10</div>
```

### Alert

```html
<div role="alert">Your session will expire in 5 minutes.</div>
```

## Landmark Roles

```html
<header role="banner">
  <nav role="navigation" aria-label="Main">...</nav>
</header>

<main role="main">
  <section aria-labelledby="section-title">
    <h2 id="section-title">Section</h2>
  </section>
</main>

<aside role="complementary" aria-label="Related">...</aside>

<footer role="contentinfo">...</footer>
```

## Form Patterns

### Error Handling

```html
<label for="email">Email (required)</label>
<input
  type="email"
  id="email"
  aria-required="true"
  aria-invalid="true"
  aria-describedby="email-error"
/>
<span id="email-error" role="alert"> Please enter a valid email address </span>
```

### Field Description

```html
<label for="password">Password</label>
<input type="password" id="password" aria-describedby="password-help" />
<p id="password-help">Must be at least 8 characters with one number</p>
```

## Resources

- [APG (ARIA Authoring Practices Guide)](https://www.w3.org/WAI/ARIA/apg/)
- [MDN ARIA](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA)
