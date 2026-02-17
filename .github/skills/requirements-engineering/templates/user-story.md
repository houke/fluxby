# User Story Template

## Story: [Title]

| Field            | Value                              |
| ---------------- | ---------------------------------- |
| **Story ID**     | [PROJ-###]                         |
| **Epic**         | [Parent epic name]                 |
| **Priority**     | P0 / P1 / P2                       |
| **Story Points** | [1/2/3/5/8/13]                     |
| **Author**       | [Name]                             |
| **Status**       | Draft / Ready / In Progress / Done |

---

## User Story

**As a** [type of user],
**I want** [goal or desire],
**So that** [benefit or value].

---

## Acceptance Criteria

### Scenario 1: [Happy Path]

```gherkin
Given [precondition/context]
  And [additional context if needed]
When [action taken by user]
  And [additional action if needed]
Then [expected result]
  And [additional result if needed]
```

### Scenario 2: [Alternative Path]

```gherkin
Given [precondition/context]
When [action taken by user]
Then [expected result]
```

### Scenario 3: [Error Case]

```gherkin
Given [precondition/context]
When [action that causes error]
Then [error handling behavior]
  And [user can recover by...]
```

---

## Validation Rules

- [ ] [Rule 1 - e.g., "Email must be valid format"]
- [ ] [Rule 2 - e.g., "Password minimum 8 characters"]
- [ ] [Rule 3 - e.g., "Name cannot exceed 100 characters"]

---

## UI/UX Requirements

### Visual

- [ ] [Design requirement - e.g., "Follow design system button styles"]
- [ ] [Layout requirement - e.g., "Form fields stack on mobile"]

### Interaction

- [ ] [Interaction pattern - e.g., "Show loading spinner during submit"]
- [ ] [Feedback - e.g., "Success message displays for 3 seconds"]

### Accessibility

- [ ] [A11y requirement - e.g., "Form fields have visible labels"]
- [ ] [A11y requirement - e.g., "Error messages announced by screen reader"]

---

## Technical Notes

### Dependencies

- [ ] [Dependency 1 - e.g., "Requires user authentication"]
- [ ] [Dependency 2 - e.g., "Uses notification service"]

### API Requirements

- [ ] [API endpoint - e.g., "POST /api/users"]
- [ ] [API behavior - e.g., "Returns 201 on success"]

### Performance

- [ ] [Performance requirement - e.g., "Response under 500ms"]

### Security

- [ ] [Security requirement - e.g., "Input sanitization required"]

---

## Out of Scope

- [Item 1 - explicitly excluded]
- [Item 2 - will be addressed in future story]

---

## Design Assets

- [Link to Figma/designs]
- [Link to prototype]

---

## Open Questions

- [ ] [Question 1 needing clarification]
- [ ] [Question 2 needing clarification]

---

## Definition of Done

- [ ] Code complete and peer reviewed
- [ ] Unit tests written and passing
- [ ] Integration tests passing
- [ ] Acceptance criteria verified
- [ ] Accessibility tested
- [ ] Documentation updated
- [ ] Deployed to staging
- [ ] QA verified
- [ ] Product owner accepted

---

## Notes

[Any additional context, discussion notes, or decisions made]
