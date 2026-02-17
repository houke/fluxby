# PRD (Product Requirements Document) Guide

## What is a PRD?

A Product Requirements Document defines what to build and why, without specifying how. It aligns stakeholders, guides development, and serves as the source of truth for a feature or product.

---

## PRD Structure

### 1. Overview

| Section          | Content                      |
| ---------------- | ---------------------------- |
| **Title**        | Feature/product name         |
| **Author**       | PRD owner                    |
| **Status**       | Draft / In Review / Approved |
| **Last Updated** | Date                         |
| **Stakeholders** | List of reviewers            |

### 2. Problem Statement

**What problem are we solving?**

- Describe the user pain point
- Include data/evidence
- Explain impact of not solving

**Example**:

> Users abandon checkout at a 68% rate. Exit surveys indicate confusion about shipping costs. Showing shipping costs earlier could reduce abandonment by 15-20% based on A/B tests from similar companies.

### 3. Goals & Success Metrics

| Goal                      | Metric                   | Target     | Timeline |
| ------------------------- | ------------------------ | ---------- | -------- |
| Reduce cart abandonment   | Checkout conversion rate | +15%       | 3 months |
| Improve user satisfaction | NPS score                | +10 points | 6 months |
| Increase revenue          | Average order value      | +5%        | 3 months |

### 4. User Personas

**Primary Persona**: Who is this for?

| Attribute    | Detail                     |
| ------------ | -------------------------- |
| Name         | Sarah                      |
| Role         | Busy professional          |
| Goal         | Quick, confident purchases |
| Pain Point   | Surprise costs at checkout |
| Tech Comfort | Moderate                   |

### 5. User Stories

Priority tiers:

**P0 - Must Have**

- As a customer, I want to see shipping cost on the product page
- As a customer, I want to see estimated delivery date

**P1 - Should Have**

- As a customer, I want to compare shipping options
- As a customer, I want to save my shipping preference

**P2 - Nice to Have**

- As a customer, I want to see real-time delivery tracking
- As a customer, I want shipping notifications

### 6. Requirements

#### Functional Requirements

| ID   | Requirement                                  | Priority |
| ---- | -------------------------------------------- | -------- |
| FR-1 | Display shipping cost on product detail page | P0       |
| FR-2 | Calculate shipping based on user location    | P0       |
| FR-3 | Show delivery estimate range                 | P0       |
| FR-4 | Allow shipping method selection              | P1       |

#### Non-Functional Requirements

| Category      | Requirement                             |
| ------------- | --------------------------------------- |
| Performance   | Shipping calculation < 500ms            |
| Availability  | 99.9% uptime for shipping API           |
| Scalability   | Handle 10x Black Friday traffic         |
| Security      | No PII in client-side shipping requests |
| Accessibility | WCAG 2.1 AA compliance                  |

### 7. User Experience

**User Flow**:

```
Product Page → See shipping estimate → Add to cart → Checkout → Confirm
```

**Wireframes**: [Link to Figma]

**Key Screens**:

1. Product page with shipping widget
2. Shipping options in cart
3. Shipping selection in checkout

### 8. Technical Considerations

- Integration with shipping provider APIs
- Caching strategy for shipping rates
- Fallback if shipping API unavailable
- Impact on page load time

### 9. Dependencies

| Dependency                 | Owner          | Status      |
| -------------------------- | -------------- | ----------- |
| Shipping API integration   | Platform team  | In progress |
| Location detection service | Infrastructure | Complete    |
| Design system updates      | Design         | Pending     |

### 10. Risks & Mitigations

| Risk                  | Likelihood | Impact | Mitigation                          |
| --------------------- | ---------- | ------ | ----------------------------------- |
| Shipping API downtime | Medium     | High   | Cache recent rates, show estimate   |
| Inaccurate rates      | Low        | Medium | Verify with carrier, add disclaimer |
| Increased page load   | Medium     | Medium | Lazy load, optimize API calls       |

### 11. Timeline

| Phase       | Dates    | Deliverables                        |
| ----------- | -------- | ----------------------------------- |
| Discovery   | Week 1-2 | User research, competitive analysis |
| Design      | Week 3-4 | Wireframes, prototypes              |
| Development | Week 5-8 | Feature implementation              |
| QA          | Week 9   | Testing, bug fixes                  |
| Launch      | Week 10  | Staged rollout                      |

### 12. Open Questions

- [ ] Which shipping carriers to support initially?
- [ ] How to handle international shipping?
- [ ] What's the fallback if we can't determine location?

---

## PRD Best Practices

### Do's

- ✅ Focus on the "what" and "why", not "how"
- ✅ Include measurable success criteria
- ✅ Prioritize requirements clearly
- ✅ Get stakeholder sign-off before development
- ✅ Update as decisions are made
- ✅ Link to related documents

### Don'ts

- ❌ Specify implementation details
- ❌ Include every edge case (save for specs)
- ❌ Write requirements without user research
- ❌ Skip the problem statement
- ❌ Forget about non-functional requirements
- ❌ Let the PRD become stale

---

## PRD Review Checklist

Before marking "Approved":

**Problem & Goals**

- [ ] Problem is clearly defined with evidence
- [ ] Success metrics are measurable
- [ ] Goals are achievable and time-bound

**Requirements**

- [ ] All user stories follow standard format
- [ ] Requirements are prioritized
- [ ] No implementation details in requirements
- [ ] Non-functional requirements included

**Scope**

- [ ] Out of scope items listed
- [ ] Dependencies identified
- [ ] Risks and mitigations documented

**Stakeholder Alignment**

- [ ] Engineering has reviewed technical feasibility
- [ ] Design has reviewed UX requirements
- [ ] QA has reviewed testability
- [ ] Legal/compliance has reviewed if applicable
- [ ] All stakeholders have signed off

---

## PRD Template

```markdown
# PRD: [Feature Name]

## Overview

| Field        | Value   |
| ------------ | ------- |
| Author       | [Name]  |
| Status       | Draft   |
| Last Updated | [Date]  |
| Stakeholders | [Names] |

## Problem Statement

[Describe the problem with evidence]

## Goals & Success Metrics

| Goal | Metric | Target |
| ---- | ------ | ------ |
|      |        |        |

## User Personas

[Describe primary and secondary users]

## User Stories

### P0 - Must Have

- As a [user], I want [goal], so that [benefit]

### P1 - Should Have

-

### P2 - Nice to Have

-

## Requirements

### Functional

| ID  | Requirement | Priority |
| --- | ----------- | -------- |
|     |             |          |

### Non-Functional

| Category | Requirement |
| -------- | ----------- |
|          |             |

## User Experience

[Link to designs, describe key flows]

## Technical Considerations

[High-level technical notes, integrations]

## Dependencies

| Dependency | Owner | Status |
| ---------- | ----- | ------ |
|            |       |        |

## Risks & Mitigations

| Risk | Mitigation |
| ---- | ---------- |
|      |            |

## Timeline

| Phase | Dates |
| ----- | ----- |
|       |       |

## Open Questions

- [ ]

## Appendix

[Links to research, competitive analysis, etc.]
```
