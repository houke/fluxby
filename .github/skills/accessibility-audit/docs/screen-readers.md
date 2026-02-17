# Screen Reader Testing Guide

## Overview

Screen readers convert digital text and interface elements into speech or braille output, enabling blind and visually impaired users to navigate and interact with web content.

## Major Screen Readers

### VoiceOver (macOS/iOS)

**Market Share**: ~25% of screen reader users

#### Setup

- macOS: System Preferences > Accessibility > VoiceOver
- Enable: `Cmd + F5`

#### Essential Commands

| Action             | Shortcut         |
| ------------------ | ---------------- |
| Start/Stop         | Cmd + F5         |
| VoiceOver key (VO) | Control + Option |
| Next item          | VO + Right Arrow |
| Previous item      | VO + Left Arrow  |
| Activate           | VO + Space       |
| Rotor (navigation) | VO + U           |
| Read all           | VO + A           |
| Stop reading       | Control          |

#### Rotor Navigation

The rotor provides quick access to different element types:

- Headings
- Links
- Form controls
- Landmarks
- Tables

### NVDA (Windows)

**Market Share**: ~40% of screen reader users

#### Setup

- Download from nvaccess.org (free)
- Install and run

#### Essential Commands

| Action        | Shortcut            |
| ------------- | ------------------- |
| Start         | Ctrl + Alt + N      |
| NVDA key      | Insert or Caps Lock |
| Next item     | Down Arrow          |
| Previous item | Up Arrow            |
| Activate      | Enter               |
| Elements list | NVDA + F7           |
| Read all      | NVDA + Down Arrow   |
| Stop reading  | Control             |

#### Browse vs Focus Mode

- **Browse mode**: Navigate with arrow keys
- **Focus mode**: Type in form fields
- Toggle: NVDA + Space

### JAWS (Windows)

**Market Share**: ~30% of screen reader users

#### Essential Commands

| Action          | Shortcut |
| --------------- | -------- |
| Next heading    | H        |
| Next link       | Tab      |
| Next button     | B        |
| Next form field | F        |
| Headings list   | Ins + F6 |
| Links list      | Ins + F7 |

### TalkBack (Android)

**Market Share**: ~5% of screen reader users

#### Essential Gestures

| Action        | Gesture            |
| ------------- | ------------------ |
| Next item     | Swipe right        |
| Previous item | Swipe left         |
| Activate      | Double tap         |
| Scroll        | Two-finger swipe   |
| Home          | Swipe up then left |

## Testing Methodology

### 1. Navigation Test

```
□ Can reach all content via keyboard
□ Skip link works and is announced
□ Landmarks are announced correctly
□ Headings create logical structure
□ Focus order matches visual order
```

### 2. Content Test

```
□ All images have appropriate alt text
□ Links make sense out of context
□ Form labels are announced
□ Errors are announced
□ Dynamic content changes are announced
```

### 3. Interaction Test

```
□ Buttons announce their purpose
□ Menus are navigable
□ Modals trap focus
□ Custom widgets are operable
□ Status messages are announced
```

## Common Issues

### Issue: Missing Announcements

```html
<!-- ❌ Bad -->
<div class="button" onclick="submit()">Submit</div>

<!-- ✅ Good -->
<button type="submit">Submit</button>
```

### Issue: No Live Region

```html
<!-- ❌ Bad: Status not announced -->
<div class="status">Form submitted!</div>

<!-- ✅ Good: Status announced -->
<div role="status" aria-live="polite">Form submitted!</div>
```

### Issue: Unlabeled Form

```html
<!-- ❌ Bad -->
<input type="email" placeholder="Email" />

<!-- ✅ Good -->
<label for="email">Email</label>
<input type="email" id="email" />
```

## Testing Script

```markdown
## Screen Reader Test: [Page Name]

**Tester**: [Name]
**Screen Reader**: [VoiceOver/NVDA/JAWS]
**Browser**: [Chrome/Firefox/Safari]
**Date**: [Date]

### Navigation

- [ ] Page title is announced on load
- [ ] Skip to main content works
- [ ] All landmarks are present and labeled
- [ ] Heading structure is logical (h1 → h2 → h3)

### Content

- [ ] All images have alt text
- [ ] Decorative images are hidden
- [ ] Links describe destination
- [ ] Tables have headers

### Forms

- [ ] All fields have labels
- [ ] Required fields are indicated
- [ ] Error messages are announced
- [ ] Success messages are announced

### Interactive Elements

- [ ] Buttons announce purpose
- [ ] Expandable content state is announced
- [ ] Modal focus is trapped
- [ ] Escape closes modal

### Issues Found

| Issue | WCAG | Severity | Location |
| ----- | ---- | -------- | -------- |
|       |      |          |          |
```

## Resources

- [WebAIM Screen Reader Survey](https://webaim.org/projects/screenreadersurvey9/)
- [Deque Screen Reader Basics](https://www.deque.com/blog/screen-reader-basics/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
