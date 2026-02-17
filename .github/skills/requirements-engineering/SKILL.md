---
name: requirements-engineering
description: User story templates, acceptance criteria patterns, PRD structures for defining clear product requirements.
---

# Requirements Engineering Skill

Define clear, actionable product requirements using proven templates and frameworks.

## Quick Start

```markdown
## US-001: User Login

**As a** registered user
**I want** to log in with my email and password
**So that** I can access my personal dashboard

### Acceptance Criteria

- [ ] Given valid credentials, when I submit the form, then I'm redirected to dashboard
- [ ] Given invalid credentials, when I submit, then I see an error message
- [ ] Given 5 failed attempts, when I try again, then account is locked for 15 minutes
```

## Skill Contents

### Documentation

- `docs/user-stories.md` - Writing effective user stories
- `docs/acceptance-criteria.md` - Acceptance criteria patterns
- `docs/prd-guide.md` - PRD writing guide

### Examples

- `examples/feature-stories.md` - Feature user stories example

### Templates

- `templates/user-story.md` - User story template
- `templates/prd.md` - PRD template

### Reference

- `REFERENCE.md` - Quick reference cheatsheet

## User Story Template

```markdown
## [STORY-ID] [Feature Name]

**Priority**: P0 (Critical) | P1 (High) | P2 (Medium) | P3 (Low)
**Effort**: XS (hours) | S (1-2 days) | M (3-5 days) | L (1-2 weeks) | XL (>2 weeks)
**Status**: Draft | Ready | In Progress | Done

### User Story

**As a** [specific user persona]
**I want** [goal or action]
**So that** [benefit or value received]

### Context

[Background information, related features, technical context, or prior decisions that inform this story]

### Acceptance Criteria

- [ ] **AC1**: Given [precondition], when [action], then [expected result]
- [ ] **AC2**: Given [precondition], when [action], then [expected result]
- [ ] **AC3**: Given [precondition], when [action], then [expected result]

### Edge Cases

| Scenario      | Expected Behavior |
| ------------- | ----------------- |
| [Edge case 1] | [How to handle]   |
| [Edge case 2] | [How to handle]   |
| [Edge case 3] | [How to handle]   |

### Out of Scope

- [Explicitly excluded item 1]
- [Explicitly excluded item 2]

### Dependencies

- [ ] [Dependency 1]: [Status]
- [ ] [Dependency 2]: [Status]

### Technical Notes

[Any technical considerations, constraints, or implementation hints]

### Success Metrics

| Metric     | Target         | Measurement Method |
| ---------- | -------------- | ------------------ |
| [Metric 1] | [Target value] | [How measured]     |
| [Metric 2] | [Target value] | [How measured]     |

### Open Questions

- [ ] [Question 1]?
- [ ] [Question 2]?

### Design Reference

[Link to designs, wireframes, or mockups]
```

## Acceptance Criteria Patterns

### Given-When-Then Format

```markdown
**Given** [context/precondition]
**When** [action/trigger]
**Then** [expected outcome]
**And** [additional outcome]
```

### Types of Criteria

#### Functional (What it does)

```markdown
- [ ] Given user has entered valid email and password, when they click "Login", then they are redirected to the dashboard
- [ ] Given user has invalid password, when they click "Login", then error message "Invalid credentials" is displayed
```

#### Performance (How fast)

```markdown
- [ ] Given database has 100,000 records, when user searches, then results appear within 500ms
- [ ] Given normal network conditions, when page loads, then LCP is under 2.5 seconds
```

#### Security (Protection)

```markdown
- [ ] Given user is not authenticated, when they access /dashboard, then they are redirected to /login
- [ ] Given session is expired, when user makes API request, then 401 is returned
```

#### Accessibility (Inclusive design)

```markdown
- [ ] Given user navigates with keyboard, when they reach the form, then all fields are accessible via Tab
- [ ] Given user has screen reader, when they focus on input, then label is announced
```

#### Error Handling (Failure modes)

```markdown
- [ ] Given API returns 500 error, when user submits form, then friendly error message is displayed
- [ ] Given network is offline, when user submits form, then request is queued for retry
```

### Good vs Bad Criteria

| ❌ Bad (Vague)         | ✅ Good (Specific & Testable)                         |
| ---------------------- | ----------------------------------------------------- |
| "Should be fast"       | "Page loads in under 2 seconds on 3G"                 |
| "Should look nice"     | "Follows design system spacing tokens"                |
| "Should handle errors" | "Shows retry button when network fails"               |
| "Should work offline"  | "Cached data displays when navigator.onLine is false" |
| "Should be secure"     | "Passwords are hashed with bcrypt, cost factor 12"    |
| "Should be accessible" | "All inputs have associated labels, contrast ≥ 4.5:1" |

## PRD Template

```markdown
# Product Requirements Document: [Feature Name]

**Author**: [Name]
**Last Updated**: [Date]
**Status**: Draft | In Review | Approved
**Version**: 1.0

---

## 1. Executive Summary

[2-3 sentences describing what we're building and why. This should be understandable by anyone in the company.]

## 2. Problem Statement

### Current State

[What exists today and its limitations]

### User Pain Points

1. [Pain point 1 - with evidence/data]
2. [Pain point 2 - with evidence/data]
3. [Pain point 3 - with evidence/data]

### Opportunity

[What we can improve and expected impact]

### Evidence

- [User research finding 1]
- [Support ticket trend]
- [Competitor analysis]

## 3. Goals & Non-Goals

### Goals

- [ ] [Measurable goal 1] - Target: [specific metric]
- [ ] [Measurable goal 2] - Target: [specific metric]

### Non-Goals (Explicitly Out of Scope)

- [Item 1] - Reason: [why excluded]
- [Item 2] - Reason: [why excluded]

## 4. User Personas

### Primary: [Persona Name]

- **Description**: [Who they are]
- **Goals**: [What they want]
- **Pain Points**: [Current frustrations]
- **Usage Context**: [When/where they use product]

### Secondary: [Persona Name]

- **Description**: [Who they are]
- **Goals**: [What they want]

## 5. User Stories

### Epic: [Epic Name]

| ID     | Story                                           | Priority | Effort |
| ------ | ----------------------------------------------- | -------- | ------ |
| US-001 | As a [persona], I want [goal] so that [benefit] | P1       | M      |
| US-002 | As a [persona], I want [goal] so that [benefit] | P2       | S      |

[Link to detailed user stories]

## 6. Proposed Solution

### Overview

[High-level description of the solution]

### User Flows

[Link to user flow diagrams]

### Key Screens/States

[Wireframes or descriptions of main screens]

### Information Architecture

[How content/features are organized]

## 7. Technical Considerations

### Dependencies

- [Technical dependency 1]
- [Technical dependency 2]

### Constraints

- [Constraint 1]
- [Constraint 2]

### Risks

| Risk     | Impact          | Probability     | Mitigation            |
| -------- | --------------- | --------------- | --------------------- |
| [Risk 1] | High/Medium/Low | High/Medium/Low | [Mitigation strategy] |

## 8. Success Metrics

| Metric     | Current    | Target | Timeline | Owner |
| ---------- | ---------- | ------ | -------- | ----- |
| [Metric 1] | [Baseline] | [Goal] | [When]   | [Who] |
| [Metric 2] | [Baseline] | [Goal] | [When]   | [Who] |

### How We'll Measure

[Description of analytics, experiments, or monitoring]

## 9. Launch Plan

### Phases

| Phase | Scope                 | Target Date | Success Criteria |
| ----- | --------------------- | ----------- | ---------------- |
| Alpha | Internal testing      | [Date]      | [Criteria]       |
| Beta  | Limited rollout (10%) | [Date]      | [Criteria]       |
| GA    | Full rollout          | [Date]      | [Criteria]       |

### Rollback Plan

[What triggers rollback and how]

## 10. Open Questions

- [ ] [Question 1] - Owner: [Name], Due: [Date]
- [ ] [Question 2] - Owner: [Name], Due: [Date]

## 11. Appendix

### Research Findings

[Link to research documents]

### Competitive Analysis

[Link to competitive analysis]

### Technical Spec

[Link to technical specification]

---

## Approval

| Role        | Name   | Status  | Date |
| ----------- | ------ | ------- | ---- |
| Product     | [Name] | Pending |      |
| Engineering | [Name] | Pending |      |
| Design      | [Name] | Pending |      |
```

## Prioritization Frameworks

### RICE Scoring

```
Score = (Reach × Impact × Confidence) / Effort
```

| Factor         | Scale                        | Definition                      |
| -------------- | ---------------------------- | ------------------------------- |
| **Reach**      | # users/quarter              | How many users affected         |
| **Impact**     | 0.25 (minimal) → 3 (massive) | How much it improves experience |
| **Confidence** | 50% → 100%                   | How sure are we of estimates    |
| **Effort**     | Person-weeks                 | Development time required       |

### MoSCoW Method

| Category        | Definition                          | Example             |
| --------------- | ----------------------------------- | ------------------- |
| **Must Have**   | Critical for launch, non-negotiable | User authentication |
| **Should Have** | Important but not critical          | Password reset      |
| **Could Have**  | Nice to have if time permits        | Social login        |
| **Won't Have**  | Explicitly deferred to later        | 2FA (v2)            |

### Value vs Effort Matrix

```
High Value │ Quick Wins    │  Major Projects
           │ (Do First)    │  (Plan Carefully)
───────────┼───────────────┼─────────────────
Low Value  │ Fill-ins      │  Thankless Tasks
           │ (Do Later)    │  (Avoid/Delegate)
───────────┴───────────────┴─────────────────
             Low Effort      High Effort
```

## Epic Template

```markdown
# Epic: [Epic Name]

**Owner**: [Name]
**Target Quarter**: [Q1/Q2/Q3/Q4 YYYY]
**Status**: Planning | In Progress | Complete

## Vision

[1-2 sentences describing the end state when this epic is complete]

## Background

[Context and motivation for this epic]

## User Stories

| ID     | Story         | Priority | Status      |
| ------ | ------------- | -------- | ----------- |
| US-001 | [Story title] | P1       | Done        |
| US-002 | [Story title] | P1       | In Progress |
| US-003 | [Story title] | P2       | Not Started |

## Success Criteria

- [ ] [Measurable outcome 1]
- [ ] [Measurable outcome 2]

## Dependencies

- [Dependency 1]
- [Dependency 2]

## Risks

- [Risk 1]: [Mitigation]
- [Risk 2]: [Mitigation]
```

## Requirements Checklist

Before marking requirements as "Ready for Development":

```markdown
### Completeness

- [ ] User value is clearly articulated
- [ ] All acceptance criteria use Given/When/Then format
- [ ] Edge cases are documented
- [ ] Out of scope is explicit
- [ ] Error states are defined

### Clarity

- [ ] No ambiguous language ("should", "might", "could")
- [ ] Success metrics are measurable
- [ ] Examples provided where helpful

### Feasibility

- [ ] Dependencies are identified
- [ ] Technical constraints documented
- [ ] Engineering has reviewed for feasibility
- [ ] Effort estimate provided

### Design

- [ ] UX flows reviewed with design
- [ ] Wireframes/mockups attached
- [ ] Edge case UIs defined

### Alignment

- [ ] Stakeholders have approved
- [ ] Fits within sprint/release capacity
- [ ] No conflicting requirements
```

## Communication Templates

### Stakeholder Update

```markdown
## [Feature Name] Update - [Date]

### Status: 🟢 On Track | 🟡 At Risk | 🔴 Blocked

### Progress

- Completed: [List completed items]
- In Progress: [Current work]
- Next Up: [What's coming]

### Key Decisions Made

1. [Decision 1]: [Rationale]
2. [Decision 2]: [Rationale]

### Blockers/Risks

| Issue   | Impact   | Mitigation | Owner  |
| ------- | -------- | ---------- | ------ |
| [Issue] | [Impact] | [Action]   | [Name] |

### Timeline

- Original: [Date]
- Current: [Date]
- Variance: [+/- days]

### Questions/Decisions Needed

1. [Question needing stakeholder input]
```

## After Requirements Definition

> [!IMPORTANT]
> After defining requirements, you MUST:
>
> 1. Verify all acceptance criteria use Given/When/Then format
> 2. Ensure success metrics are measurable
> 3. Document all edge cases and error states
> 4. Get sign-off from @ux-designer and @tech-lead
> 5. Schedule refinement session with engineering
