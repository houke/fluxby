# Requirements Engineering Quick Reference

## User Story Format

```markdown
**As a** [specific persona]
**I want** [goal/action]
**So that** [benefit/value]
```

## Acceptance Criteria (Given-When-Then)

```markdown
**Given** [precondition/context]
**When** [action/trigger]
**Then** [expected outcome]
**And** [additional outcome]
```

## Story Sizing

| Size | Duration  | Complexity |
| ---- | --------- | ---------- |
| XS   | Hours     | Trivial    |
| S    | 1-2 days  | Simple     |
| M    | 3-5 days  | Moderate   |
| L    | 1-2 weeks | Complex    |
| XL   | >2 weeks  | Epic/Split |

## Priority Levels

| Level | Meaning  | Example      |
| ----- | -------- | ------------ |
| P0    | Critical | Core auth    |
| P1    | High     | Key feature  |
| P2    | Medium   | Enhancement  |
| P3    | Low      | Nice to have |

## RICE Scoring

```
Score = (Reach × Impact × Confidence) / Effort

Reach:      Users affected per quarter
Impact:     0.25 (minimal) → 3 (massive)
Confidence: 50% → 100%
Effort:     Person-weeks
```

## MoSCoW Prioritization

| Category   | Definition               |
| ---------- | ------------------------ |
| **Must**   | Critical, non-negotiable |
| **Should** | Important, not critical  |
| **Could**  | Nice to have             |
| **Won't**  | Explicitly deferred      |

## Value vs Effort Matrix

```
         │ Low Effort   │ High Effort
─────────┼──────────────┼──────────────
High     │ Quick Wins   │ Major
Value    │ (Do First)   │ Projects
─────────┼──────────────┼──────────────
Low      │ Fill-ins     │ Avoid
Value    │ (Do Later)   │ (Skip)
```

## Story Status Flow

```
Draft → Ready → In Progress → In Review → Done
```

## Acceptance Criteria Types

| Type          | Covers        |
| ------------- | ------------- |
| Functional    | What it does  |
| Performance   | How fast      |
| Security      | Protection    |
| Accessibility | Inclusive     |
| Error         | Failure modes |

## Good vs Bad Criteria

| ❌ Vague        | ✅ Specific            |
| --------------- | ---------------------- |
| "Fast"          | "< 2s on 3G"           |
| "Nice"          | "Design system tokens" |
| "Secure"        | "bcrypt, cost 12"      |
| "Works offline" | "Shows cached data"    |

## Story Template (Minimal)

```markdown
## [ID] [Title]

**Priority**: P1 | **Effort**: M

**As a** [persona]
**I want** [goal]
**So that** [benefit]

### Acceptance Criteria

- [ ] Given X, when Y, then Z
- [ ] Given A, when B, then C

### Out of Scope

- [Excluded item]
```

## Epic Template

```markdown
# Epic: [Name]

**Owner**: [Name]
**Target**: [Quarter]

## Vision

[End state description]

## Stories

| ID     | Story       | Priority |
| ------ | ----------- | -------- |
| US-001 | Story title | P1       |

## Success Criteria

- [ ] Measurable outcome
```

## PRD Sections

```
1. Executive Summary
2. Problem Statement
3. Goals & Non-Goals
4. User Personas
5. User Stories
6. Proposed Solution
7. Technical Considerations
8. Success Metrics
9. Launch Plan
10. Open Questions
```

## Metrics Framework

| Metric Type  | Example           |
| ------------ | ----------------- |
| Engagement   | DAU, time in app  |
| Conversion   | Sign-up rate      |
| Retention    | Day 7 return      |
| Satisfaction | NPS, CSAT         |
| Performance  | Load time, errors |

## Success Metrics Template

```markdown
| Metric | Current    | Target | Timeline |
| ------ | ---------- | ------ | -------- |
| [Name] | [Baseline] | [Goal] | [When]   |
```

## Stakeholder Update

```markdown
## [Feature] Update - [Date]

### Status: 🟢 On Track | 🟡 At Risk | 🔴 Blocked

### Progress

- Completed: [Items]
- In Progress: [Items]
- Next: [Items]

### Blockers

| Issue | Impact | Owner |
| ----- | ------ | ----- |

### Questions

1. [Question needing input]
```

## Definition of Ready

```
□ User value articulated
□ Acceptance criteria complete
□ Edge cases documented
□ Out of scope explicit
□ Dependencies identified
□ Design attached
□ Effort estimated
□ No blocking questions
```

## Definition of Done

```
□ Code complete
□ Tests passing
□ Code reviewed
□ Documentation updated
□ Deployed to staging
□ QA verified
□ Acceptance criteria met
```

## Estimation Poker Cards

```
0, 1, 2, 3, 5, 8, 13, 21, ?, ☕
```

## Sprint Capacity

```
Velocity = Completed points / Sprint
Capacity = Team size × Days × Focus %
```

## Refinement Questions

```
□ Who is the user?
□ What problem does it solve?
□ How will we know it works?
□ What could go wrong?
□ What's the simplest solution?
□ Is this the right size?
□ Are dependencies met?
```

## Common Anti-patterns

| Anti-pattern           | Fix                        |
| ---------------------- | -------------------------- |
| No acceptance criteria | Add Given/When/Then        |
| Vague requirements     | Be specific, measurable    |
| Missing edge cases     | Document error states      |
| No success metrics     | Define how to measure      |
| Too large              | Split into smaller stories |
| Solution in story      | Focus on user need         |
