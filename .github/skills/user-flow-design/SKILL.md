---
name: user-flow-design
description: User journey mapping, wireframe conventions, interaction patterns for designing intuitive user experiences.
---

# User Flow Design Skill

Design intuitive user experiences through journey mapping, wireframes, and interaction patterns.

## Quick Start

```markdown
## Flow: User Registration

**Trigger**: User clicks "Sign Up"
**Goal**: Create new account
**Personas**: New users, mobile users

### Happy Path

[Landing] → (Click Sign Up) → [Registration Form] → (Submit) → [Email Verification] → [Dashboard]
```

## Skill Contents

### Documentation

- `docs/journey-mapping.md` - User journey mapping techniques
- `docs/wireframe-standards.md` - Wireframing conventions
- `docs/interaction-patterns.md` - Common interaction patterns

### Examples

- `examples/checkout-flow.md` - E-commerce checkout flow
- `examples/onboarding-flow.md` - User onboarding flow

### Templates

- `templates/user-flow.md` - User flow template

### Reference

- `REFERENCE.md` - Quick reference cheatsheet

## User Flow Notation

### Basic Flow

```
[State A] → (Action) → [State B]
```

### Branching Flow

```
[State A] → (Action) → [State B]
               │
               ├─ (Alternative) → [State C]
               │
               └─ (Error) → [Error State]
```

### Decision Points

```
[State A] → (Action) → <Condition?>
                           │
                    Yes ───┼─── No
                           │
                    [State B]  [State C]
```

### Complete Flow Template

```markdown
## Flow: [Name]

**Trigger**: [What initiates this flow]
**Goal**: [What user wants to accomplish]
**Personas**: [Which users use this flow]
**Frequency**: [How often this flow is used]

### Happy Path

[Start] → (Action 1) → [State 1] → (Action 2) → [End State]

### Alternative Paths

#### Path A: [Variation Name]

[Start] → (Alt Action) → [Alt State] → [End State]

#### Path B: [Another Variation]

[State 1] → (Different Choice) → [Different End]

### Error Paths

#### Error: [Error Name]

[State] → (Failing Action) → [Error State] → (Retry) → [State]

### States

| State         | Description   | Key Elements     | Entry Criteria    |
| ------------- | ------------- | ---------------- | ----------------- |
| [Start]       | Initial state | CTA button       | User on page      |
| [State 1]     | Processing    | Form, validation | Valid input       |
| [End State]   | Success       | Confirmation     | Action complete   |
| [Error State] | Failure       | Error message    | Validation failed |

### Metrics

| Metric           | Target | Measurement       |
| ---------------- | ------ | ----------------- |
| Completion rate  | >90%   | Analytics         |
| Time to complete | <2 min | Session recording |
| Error rate       | <5%    | Error tracking    |
```

## Wireframe Conventions

### Mobile Layout Template

```
┌─────────────────────────────────────┐
│            Status Bar               │  ← System UI (not designed)
├─────────────────────────────────────┤
│  ←  Title                     ⋮     │  ← App Header / Navigation
├─────────────────────────────────────┤
│                                     │
│                                     │
│           Main Content              │  ← Scrollable Area
│                                     │
│                                     │
│                                     │
├─────────────────────────────────────┤
│    [   Primary Action Button   ]    │  ← Sticky Footer (optional)
├─────────────────────────────────────┤
│  🏠    📍    ➕    💬    👤        │  ← Tab Bar / Bottom Nav
└─────────────────────────────────────┘
```

### Desktop Layout Template

```
┌─────────────────────────────────────────────────────────────────┐
│  Logo    Nav Item 1    Nav Item 2    Nav Item 3    [User ▼]    │
├─────────────────────────────────────────────────────────────────┤
│          │                                        │             │
│          │                                        │             │
│  Sidebar │           Main Content                 │   Aside     │
│          │                                        │             │
│          │                                        │             │
│          │                                        │             │
└──────────┴────────────────────────────────────────┴─────────────┘
```

### Component Notation

| Symbol          | Meaning           | Example                |
| --------------- | ----------------- | ---------------------- |
| `[Button Text]` | Button            | `[Submit]`, `[Cancel]` |
| `( Radio )`     | Radio option      | `( Option A )`         |
| `[x] Checkbox`  | Checkbox          | `[x] Remember me`      |
| `[___________]` | Text input        | `[___________]` Email  |
| `[▼ Dropdown ]` | Select            | `[▼ Select country]`   |
| `< Slider >`    | Slider            | `< ●━━━━━━━ >`         |
| `[Image 16:9]`  | Image placeholder | `[Hero Image 16:9]`    |
| `← →`           | Navigation arrows | `← Back`, `Next →`     |
| `⋮`             | More menu         | Overflow menu          |
| `×`             | Close button      | Modal close            |
| `🔍`            | Search            | Search input           |
| `⚙️`            | Settings          | Settings access        |

### Annotation Style

```
┌───────────────────────────────────────┐
│                                       │
│   ┌─────────────────────────────┐     │
│   │                             │ ← 1 │
│   │      Component Name         │     │
│   │                             │     │
│   └─────────────────────────────┘     │
│                                       │
│   Annotation text explaining          │
│   the behavior or purpose.            │
│                                       │
└───────────────────────────────────────┘

1. Component description with interaction details
```

## Interaction States

Every interactive element should define these states:

```markdown
### [Component Name] States

| State          | Visual            | Behavior                    |
| -------------- | ----------------- | --------------------------- |
| Default        | Base appearance   | Ready for interaction       |
| Hover          | Subtle highlight  | Desktop cursor over element |
| Pressed/Active | Depressed look    | Actively clicking/touching  |
| Focused        | Focus ring        | Keyboard navigation         |
| Disabled       | Dimmed, no cursor | Not available               |
| Loading        | Spinner/skeleton  | Async operation             |
| Error          | Red border/icon   | Validation failed           |
| Success        | Green checkmark   | Operation succeeded         |
```

### Button State Example

```
Default:    [  Submit  ]     Normal appearance
Hover:      [  Submit  ] ← Slight shadow, brightness
Pressed:    [ Submit ]       Smaller, darker
Focused:    [  Submit  ]     Blue outline ring
Disabled:   [  Submit  ]     Grayed out, no pointer
Loading:    [  ◌  ...  ]     Spinner, disabled
```

## Gesture Patterns

### Standard Mobile Gestures

| Gesture          | Use For           | Example                   |
| ---------------- | ----------------- | ------------------------- |
| Tap              | Primary action    | Select item, press button |
| Double Tap       | Quick action      | Like, zoom                |
| Long Press       | Secondary actions | Context menu              |
| Swipe Left/Right | Reveal actions    | Delete, archive           |
| Swipe Down       | Refresh, dismiss  | Pull to refresh           |
| Swipe Up         | Expand            | Bottom sheet expand       |
| Pinch            | Zoom              | Map, image zoom           |
| Pan              | Move content      | Scroll, map move          |

### Gesture Documentation

```markdown
### Gestures: [Screen Name]

| Element      | Gesture     | Action         | Feedback          |
| ------------ | ----------- | -------------- | ----------------- |
| List item    | Swipe left  | Reveal delete  | Red background    |
| List item    | Swipe right | Reveal archive | Green background  |
| Card         | Long press  | Show options   | Haptic + menu     |
| Image        | Pinch       | Zoom in/out    | Animated scale    |
| Bottom sheet | Swipe down  | Dismiss        | Slide animation   |
| Pull area    | Swipe down  | Refresh        | Loading indicator |
```

## Empty States

```markdown
### Empty State: [Screen Name]

**When**: [Condition for empty state]

**Display**:

- Illustration: [Description or name]
- Headline: "[Encouraging message]"
- Body: "[Explanation and guidance]"
- CTA: [Primary action button]

**Tone**: [Friendly / Instructive / Motivating]

**Example**:
┌─────────────────────────────────────┐
│ │
│ 📭 (illustration) │
│ │
│ No messages yet │
│ │
│ When you receive messages, │
│ they'll appear here. │
│ │
│ [ Start a conversation ] │
│ │
└─────────────────────────────────────┘
```

## Loading States

```markdown
### Loading: [Operation Name]

**Duration**: [Expected time range]
**Pattern**: Skeleton | Spinner | Progress Bar

**Progressive Loading**:

1. Show skeleton immediately
2. Load critical content first
3. Load secondary content
4. Remove skeletons as content loads

**Skeleton Pattern**:
┌─────────────────────────────────────┐
│ ████████████ │ ██████ │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│ ░░░░░░░░░░░░░░░ │
└─────────────────────────────────────┘
```

## Error Handling

```markdown
### Error State: [Error Type]

**Trigger**: [What causes this error]
**User Impact**: [How it affects the user]

**Display**:

- Icon: ⚠️ Warning / ❌ Error / ℹ️ Info
- Message: "[Clear, actionable error message]"
- Actions: [Retry / Go Back / Contact Support]

**Recovery Path**:
[Error State] → (Retry) → [Loading] → [Success]
or
[Error State] → (Go Back) → [Previous State]

**Example**:
┌─────────────────────────────────────┐
│ ⚠️ │
│ │
│ Unable to load your data │
│ │
│ Please check your connection │
│ and try again. │
│ │
│ [ Try Again ] [ Go Back ] │
└─────────────────────────────────────┘
```

## Accessibility Requirements

### Per-Element Checklist

- [ ] Has accessible name (aria-label or visible text)
- [ ] Touch target ≥ 44×44px
- [ ] Color contrast ≥ 4.5:1 (text) or 3:1 (large)
- [ ] Not color-only indicator
- [ ] Keyboard reachable
- [ ] Focus visible
- [ ] Screen reader announces state changes

### Per-Flow Checklist

- [ ] Focus order matches visual order
- [ ] Modals trap focus
- [ ] Escape closes modals/menus
- [ ] Loading states announced
- [ ] Errors associated with inputs
- [ ] Skip links for repetitive content
- [ ] Landmarks defined (nav, main, etc.)

## Common UI Patterns

### Navigation Patterns

| Pattern        | Use When             | Example                    |
| -------------- | -------------------- | -------------------------- |
| Bottom tabs    | 3-5 main sections    | Home, Search, Profile      |
| Hamburger menu | Many sections        | Settings, secondary pages  |
| Top tabs       | Content categories   | All, Following, Popular    |
| Breadcrumbs    | Deep hierarchy       | Products > Category > Item |
| Drawer         | Secondary navigation | Sidebar with options       |

### Input Patterns

| Pattern            | Use When           | Example                 |
| ------------------ | ------------------ | ----------------------- |
| Inline validation  | Real-time feedback | Email format check      |
| Stepper            | Multi-step form    | Checkout process        |
| Search-as-you-type | Large datasets     | Search with suggestions |
| Date picker        | Date selection     | Booking dates           |
| Slider             | Range selection    | Price filter            |

### Feedback Patterns

| Pattern            | Use When          | Example               |
| ------------------ | ----------------- | --------------------- |
| Toast              | Non-blocking info | "Saved successfully"  |
| Snackbar           | Action + undo     | "Item deleted" [Undo] |
| Modal              | Requires decision | "Confirm delete?"     |
| Inline message     | Form feedback     | "Password too weak"   |
| Progress indicator | Long operations   | Upload progress       |

## User Research Methods

| Method            | Best For                 | When to Use        |
| ----------------- | ------------------------ | ------------------ |
| User interviews   | Understanding needs      | Discovery phase    |
| Usability testing | Validating designs       | Before development |
| A/B testing       | Comparing options        | After launch       |
| Analytics         | Behavior patterns        | Ongoing            |
| Surveys           | Quantitative feedback    | Periodic           |
| Card sorting      | Information architecture | IA design          |
| Heatmaps          | Click patterns           | Post-launch        |

## After Flow Design

> [!IMPORTANT]
> After designing flows, you MUST:
>
> 1. Verify all interaction states are defined
> 2. Document empty, loading, and error states
> 3. Include accessibility annotations
> 4. Get review from @visual-designer before development
> 5. Validate with user testing if possible
