# User Flow Template

## Flow Overview

| Field                  | Value                        |
| ---------------------- | ---------------------------- |
| **Flow Name**          | [Name]                       |
| **Description**        | [Brief description]          |
| **User Persona**       | [Target user]                |
| **Entry Points**       | [How users access this flow] |
| **Success Criteria**   | [What defines completion]    |
| **Estimated Duration** | [Time to complete]           |

---

## Flow Diagram

```
Start: [Entry Point]
         │
         ▼
    ┌─────────┐
    │ Step 1  │
    │ [Name]  │
    └────┬────┘
         │
    [Decision?]──No──→ [Alternative Path]
         │
        Yes
         │
         ▼
    ┌─────────┐
    │ Step 2  │
    │ [Name]  │
    └────┬────┘
         │
         ▼
    ┌─────────┐
    │ Step 3  │
    │ [Name]  │
    └────┬────┘
         │
         ▼
    ┌─────────┐
    │ Success │
    │  State  │
    └─────────┘
```

---

## Detailed Steps

### Step 1: [Step Name]

**Screen/Page**: [Screen name]

**User Goal**: [What user wants to accomplish]

**Actions Available**:

- [ ] Primary action: [Description]
- [ ] Secondary action: [Description]
- [ ] Tertiary action: [Description]

**UI Elements**:
| Element | Type | Behavior |
|---------|------|----------|
| [Element] | [Button/Input/etc] | [What it does] |

**Validation Rules**:

- [Rule 1]
- [Rule 2]

**Error States**:
| Error Condition | Message | Recovery |
|-----------------|---------|----------|
| [Condition] | [Message to show] | [How to fix] |

**Analytics Events**:

- `event_name`: [Trigger condition]

**Next Step**: [Step 2] or [Exit point]

---

### Step 2: [Step Name]

[Repeat format...]

---

## Edge Cases

### Empty State

- **When**: [Condition]
- **Display**: [What to show]
- **Action**: [What user can do]

### Error State

- **When**: [Condition]
- **Display**: [Error message/screen]
- **Recovery**: [How to proceed]

### Loading State

- **When**: [Condition]
- **Display**: [Loading indicator type]
- **Duration**: [Expected wait time]

### Offline State

- **When**: [No connectivity]
- **Display**: [Offline message]
- **Behavior**: [Queued actions, cached data]

---

## Alternative Paths

### Path A: [Name]

- **Trigger**: [What causes this path]
- **Steps**: [Abbreviated flow]
- **Outcome**: [Where it leads]

### Path B: [Name]

- **Trigger**: [What causes this path]
- **Steps**: [Abbreviated flow]
- **Outcome**: [Where it leads]

---

## Exit Points

| Exit Point | Trigger  | Destination | Data State   |
| ---------- | -------- | ----------- | ------------ |
| Complete   | [Action] | [Screen]    | [Saved/Lost] |
| Cancel     | [Action] | [Screen]    | [Saved/Lost] |
| Abandon    | [Action] | [Screen]    | [Saved/Lost] |

---

## Accessibility Requirements

- [ ] Keyboard navigation supported
- [ ] Screen reader announces: [Key elements]
- [ ] Focus management: [Focus behavior]
- [ ] Error announcement: [How errors are read]
- [ ] Time limits: [Warnings/extensions]

---

## Performance Requirements

| Metric              | Target  |
| ------------------- | ------- |
| Time to interactive | < [X]s  |
| API response time   | < [X]ms |
| Perceived load time | < [X]s  |

---

## Dependencies

### Internal

- [Service/API 1]
- [Service/API 2]

### External

- [Third-party service]
- [Integration]

---

## Open Questions

- [ ] [Question 1]
- [ ] [Question 2]

---

## Revision History

| Date   | Version | Author | Changes       |
| ------ | ------- | ------ | ------------- |
| [Date] | 1.0     | [Name] | Initial draft |
