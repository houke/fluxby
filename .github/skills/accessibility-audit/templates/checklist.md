# Accessibility Testing Checklist

## Quick Checks (5 minutes)

### Visual

- [ ] Page has a descriptive `<title>`
- [ ] Main heading (`<h1>`) is present
- [ ] Heading hierarchy is logical (h1 → h2 → h3)
- [ ] Links are visually distinct
- [ ] Focus indicator is visible on all interactive elements

### Keyboard

- [ ] Tab through entire page - all elements reachable
- [ ] Focus order matches visual order
- [ ] No keyboard traps
- [ ] Skip link present and works

### Screen Reader (Quick)

- [ ] All images have alt text
- [ ] Buttons have accessible names
- [ ] Form inputs have labels

---

## Comprehensive Audit

### Images & Media

#### Images

- [ ] Informative images have descriptive `alt` text
- [ ] Decorative images have `alt=""`
- [ ] Complex images have long descriptions
- [ ] Images of text are avoided (use real text)

#### Audio/Video

- [ ] Videos have captions
- [ ] Audio has transcripts
- [ ] Media controls are keyboard accessible
- [ ] Auto-play can be paused

### Structure & Navigation

#### Page Structure

- [ ] Page has `<main>` landmark
- [ ] Navigation is in `<nav>` element
- [ ] Landmark regions have unique labels
- [ ] Lists use proper `<ul>`, `<ol>`, `<dl>` markup

#### Headings

- [ ] Single `<h1>` per page
- [ ] Headings don't skip levels
- [ ] Headings describe content sections
- [ ] Heading levels match visual hierarchy

#### Links

- [ ] Link text describes destination
- [ ] No "click here" or "read more" alone
- [ ] Links to new windows are indicated
- [ ] Links are visually distinct from text

### Forms

#### Labels & Instructions

- [ ] Every input has a visible label
- [ ] Labels are programmatically associated (`for`/`id`)
- [ ] Required fields are indicated
- [ ] Input format is explained (e.g., "MM/DD/YYYY")

#### Validation

- [ ] Errors are clearly identified
- [ ] Error messages describe the problem
- [ ] Suggestions for correction provided
- [ ] Errors don't rely on color alone

#### Grouping

- [ ] Related fields are grouped (`<fieldset>`)
- [ ] Groups have legends (`<legend>`)
- [ ] Radio/checkbox groups are properly associated

### Color & Contrast

- [ ] Text contrast is at least 4.5:1
- [ ] Large text contrast is at least 3:1
- [ ] UI component contrast is at least 3:1
- [ ] Information not conveyed by color alone
- [ ] Focus indicators meet contrast requirements

### Interactive Elements

#### Buttons

- [ ] All buttons have accessible names
- [ ] Button purpose is clear
- [ ] Toggle buttons have state (aria-pressed)
- [ ] Disabled state is communicated

#### Custom Widgets

- [ ] Appropriate ARIA role is used
- [ ] States are communicated (expanded, selected, etc.)
- [ ] Keyboard interaction follows expected patterns
- [ ] Widget matches ARIA Authoring Practices

#### Modals/Dialogs

- [ ] Focus moves to modal on open
- [ ] Focus is trapped inside modal
- [ ] Escape key closes modal
- [ ] Focus returns to trigger on close
- [ ] `role="dialog"` and `aria-modal="true"` present

### Dynamic Content

- [ ] Loading states are announced
- [ ] Error messages are announced (live region)
- [ ] Success messages are announced
- [ ] Content changes don't unexpectedly move focus
- [ ] Timeout warnings are provided

### Responsive & Zoom

- [ ] Page is usable at 200% zoom
- [ ] Content reflows at 400% zoom
- [ ] No horizontal scrolling at 320px width
- [ ] Touch targets are at least 44×44px

### Motion & Animation

- [ ] Motion can be paused or stopped
- [ ] No content flashes more than 3 times per second
- [ ] `prefers-reduced-motion` is respected
- [ ] Essential animations don't cause vestibular issues

---

## Screen Reader Testing

### VoiceOver (macOS)

- [ ] Page title announced on load
- [ ] Landmarks navigable via rotor
- [ ] Headings listed in rotor
- [ ] Forms navigable with VO + U
- [ ] Tables have headers announced

### NVDA (Windows)

- [ ] Landmarks accessible with NVDA + F7
- [ ] Heading navigation with H key works
- [ ] Forms in browse mode work
- [ ] Focus mode enters correctly in inputs

---

## Notes

**Issues Found**:

1.

2.

3.

**Questions/Clarifications**:

1.

2.

---

**Auditor**: ******\_\_\_\_******  
**Date**: ******\_\_\_\_******  
**Result**: ⬜ Pass | ⬜ Fail | ⬜ Partial
