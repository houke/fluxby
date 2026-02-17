# User Flow Design Quick Reference

## Flow Notation

```
[State]           Screen/page state
(Action)          User action
<Condition?>      Decision point
→                 Flow direction
├─                Branch
└─                Final branch
```

## Flow Templates

### Linear Flow

```
[Start] → (Action) → [State A] → (Action) → [End]
```

### Branching Flow

```
[State A] → (Action) → <Success?>
                          │
                   Yes ───┼─── No
                          │
                   [Success]  [Error]
```

### Loop Flow

```
[State A] → (Action) → [State B] → (Evaluate) ─┐
     ↑                                         │
     └─────────── (Retry) ─────────────────────┘
```

## Wireframe Components

```
[Button Text]        Button
[___________]        Text input
[▼ Dropdown ]        Select
( Radio )            Radio button
[x] Checkbox         Checkbox
< ●━━━━━━━ >         Slider
[Image 16:9]         Image placeholder
←                    Back navigation
⋮                    More menu
×                    Close button
⚙️                   Settings
🔍                   Search
```

## Mobile Layout

```
┌─────────────────────┐
│     Status Bar      │
├─────────────────────┤
│  ←  Title      ⋮    │  Header
├─────────────────────┤
│                     │
│   Main Content      │  Scrollable
│                     │
├─────────────────────┤
│   [ Action ]        │  Sticky footer
├─────────────────────┤
│ 🏠  📍  ➕  💬  👤  │  Tab bar
└─────────────────────┘
```

## Interaction States

| State    | Use                   |
| -------- | --------------------- |
| Default  | Normal appearance     |
| Hover    | Cursor over (desktop) |
| Pressed  | Actively clicking     |
| Focused  | Keyboard focus        |
| Disabled | Not available         |
| Loading  | Async operation       |
| Error    | Validation failed     |
| Success  | Completed             |

## Touch Targets

```
Minimum: 44×44px
Recommended: 48×48px
Spacing: 8px minimum
```

## Navigation Patterns

| Pattern     | When to Use        |
| ----------- | ------------------ |
| Bottom tabs | 3-5 main sections  |
| Hamburger   | Many sections      |
| Top tabs    | Content categories |
| Breadcrumbs | Deep hierarchy     |
| Back arrow  | Sequential flow    |

## Gestures

| Gesture    | Common Use       |
| ---------- | ---------------- |
| Tap        | Select, press    |
| Double tap | Like, zoom       |
| Long press | Context menu     |
| Swipe L/R  | Reveal actions   |
| Swipe down | Refresh, dismiss |
| Pinch      | Zoom             |
| Pan        | Scroll, move     |

## Empty State Template

```
┌─────────────────────┐
│                     │
│    📭 (icon)        │
│                     │
│   No items yet      │
│                     │
│   Explanation of    │
│   what will appear  │
│   here.             │
│                     │
│   [ Add Item ]      │
└─────────────────────┘
```

## Loading States

| Pattern      | Duration         |
| ------------ | ---------------- |
| Spinner      | < 2 seconds      |
| Skeleton     | 2-10 seconds     |
| Progress bar | Known duration   |
| Toast        | Background tasks |

## Error State Template

```
┌─────────────────────┐
│                     │
│      ⚠️             │
│                     │
│   Unable to load    │
│                     │
│   [Helpful message] │
│                     │
│   [ Retry ] [Back]  │
└─────────────────────┘
```

## Accessibility Checklist

```
□ Touch target ≥ 44px
□ Color contrast ≥ 4.5:1
□ Focus visible
□ Labels on inputs
□ Error associated with field
□ Skip links
□ Landmarks defined
□ Focus order logical
```

## Spacing Scale

```
xs:   4px
sm:   8px
md:   16px
lg:   24px
xl:   32px
2xl:  48px
3xl:  64px
```

## Responsive Breakpoints

```
Mobile:    < 640px
Tablet:    640px - 1024px
Desktop:   > 1024px
```

## Information Hierarchy

```
1. Primary action   (Most prominent)
2. Section headers  (Scannable)
3. Content          (Readable)
4. Secondary action (Discoverable)
5. Metadata         (De-emphasized)
```

## Common Patterns

### List Item

```
┌─────────────────────────────┐
│ [Image] Title          →    │
│         Subtitle            │
└─────────────────────────────┘
```

### Card

```
┌─────────────────────────────┐
│  [Image 16:9]               │
├─────────────────────────────┤
│  Title                      │
│  Description text           │
│  [Action]        [Secondary]│
└─────────────────────────────┘
```

### Form Field

```
Label
┌─────────────────────────────┐
│ Placeholder text            │
└─────────────────────────────┘
Helper text or error message
```

### Modal

```
┌─────────────────────────────┐
│  Title                   ×  │
├─────────────────────────────┤
│                             │
│  Modal content              │
│                             │
├─────────────────────────────┤
│         [Cancel] [Confirm]  │
└─────────────────────────────┘
```

### Toast

```
┌─────────────────────────────┐
│ ✓  Action completed    [×]  │
└─────────────────────────────┘
```

## Flow Documentation Checklist

```
□ Happy path defined
□ Alternative paths listed
□ Error paths documented
□ Entry/exit criteria
□ State descriptions
□ Metrics defined
□ Accessibility noted
□ Edge cases covered
```
