# WCAG Guidelines Reference

## WCAG 2.2 Principles

### 1. Perceivable

Information and UI components must be presentable in ways users can perceive.

#### 1.1 Text Alternatives

- **1.1.1 Non-text Content (A)**: All non-text content has text alternative
  - Images: `alt` attribute
  - Decorative images: `alt=""`
  - Complex images: Long description

#### 1.2 Time-based Media

- **1.2.1 Audio-only/Video-only (A)**: Alternatives provided
- **1.2.2 Captions (A)**: Synchronized captions for video
- **1.2.3 Audio Description (A)**: Description of visual content

#### 1.3 Adaptable

- **1.3.1 Info and Relationships (A)**: Structure conveyed programmatically
- **1.3.2 Meaningful Sequence (A)**: Reading order is logical
- **1.3.3 Sensory Characteristics (A)**: Instructions don't rely solely on shape/size/location

#### 1.4 Distinguishable

- **1.4.1 Use of Color (A)**: Color not sole means of conveying info
- **1.4.2 Audio Control (A)**: Auto-playing audio can be paused
- **1.4.3 Contrast (Minimum) (AA)**: 4.5:1 for normal text, 3:1 for large
- **1.4.4 Resize Text (AA)**: Text resizable to 200% without loss
- **1.4.5 Images of Text (AA)**: Real text preferred over images

### 2. Operable

UI components and navigation must be operable.

#### 2.1 Keyboard Accessible

- **2.1.1 Keyboard (A)**: All functionality via keyboard
- **2.1.2 No Keyboard Trap (A)**: Focus can move away
- **2.1.4 Character Key Shortcuts (A)**: Can be turned off/remapped

#### 2.2 Enough Time

- **2.2.1 Timing Adjustable (A)**: Time limits can be extended
- **2.2.2 Pause, Stop, Hide (A)**: Moving content controllable

#### 2.3 Seizures and Physical Reactions

- **2.3.1 Three Flashes (A)**: No content flashes more than 3 times/second

#### 2.4 Navigable

- **2.4.1 Bypass Blocks (A)**: Skip navigation mechanism
- **2.4.2 Page Titled (A)**: Descriptive page titles
- **2.4.3 Focus Order (A)**: Logical focus sequence
- **2.4.4 Link Purpose (A)**: Purpose clear from link text
- **2.4.5 Multiple Ways (AA)**: Multiple ways to find pages
- **2.4.6 Headings and Labels (AA)**: Descriptive headings
- **2.4.7 Focus Visible (AA)**: Keyboard focus is visible

#### 2.5 Input Modalities

- **2.5.1 Pointer Gestures (A)**: Single pointer alternatives
- **2.5.2 Pointer Cancellation (A)**: Down-event doesn't trigger
- **2.5.3 Label in Name (A)**: Visible label in accessible name
- **2.5.4 Motion Actuation (A)**: Alternatives to motion

### 3. Understandable

Information and UI operation must be understandable.

#### 3.1 Readable

- **3.1.1 Language of Page (A)**: Default language specified
- **3.1.2 Language of Parts (AA)**: Language changes marked

#### 3.2 Predictable

- **3.2.1 On Focus (A)**: No context change on focus
- **3.2.2 On Input (A)**: No unexpected context changes
- **3.2.3 Consistent Navigation (AA)**: Navigation consistent
- **3.2.4 Consistent Identification (AA)**: Same function = same label

#### 3.3 Input Assistance

- **3.3.1 Error Identification (A)**: Errors clearly identified
- **3.3.2 Labels or Instructions (A)**: Input labels provided
- **3.3.3 Error Suggestion (AA)**: Suggestions for correction
- **3.3.4 Error Prevention (AA)**: Reversible/confirmed/reviewed

### 4. Robust

Content must be robust enough for diverse user agents.

#### 4.1 Compatible

- **4.1.1 Parsing (A)**: Valid HTML (deprecated in 2.2)
- **4.1.2 Name, Role, Value (A)**: UI components have accessible names
- **4.1.3 Status Messages (AA)**: Status messages announced

## Conformance Levels

| Level   | Target Audience        | Requirements                        |
| ------- | ---------------------- | ----------------------------------- |
| **A**   | Minimum                | Must meet all A criteria            |
| **AA**  | Standard (recommended) | Must meet all A + AA criteria       |
| **AAA** | Enhanced               | Must meet all A + AA + AAA criteria |

## Testing Priority

1. Keyboard navigation
2. Screen reader compatibility
3. Color contrast
4. Focus management
5. Form accessibility
6. Error handling
7. Dynamic content
