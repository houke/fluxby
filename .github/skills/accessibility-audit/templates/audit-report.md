# Accessibility Audit Report

## Project Information

| Field            | Value              |
| ---------------- | ------------------ |
| **Project**      | [Project Name]     |
| **URL**          | [URL or Page Path] |
| **Audit Date**   | [Date]             |
| **Auditor**      | [Name]             |
| **WCAG Version** | 2.2                |
| **Target Level** | AA                 |

## Executive Summary

**Overall Compliance**: ⚠️ Partial / ✅ Compliant / ❌ Non-Compliant

[Brief summary of findings - 2-3 sentences]

### Score Overview

| Category       | Pass    | Fail    | Score |
| -------------- | ------- | ------- | ----- |
| Perceivable    | /10     | /10     | %     |
| Operable       | /10     | /10     | %     |
| Understandable | /10     | /10     | %     |
| Robust         | /10     | /10     | %     |
| **Total**      | **/40** | **/40** | **%** |

## Testing Methodology

### Tools Used

- [ ] axe DevTools (automated)
- [ ] WAVE (automated)
- [ ] Lighthouse (automated)
- [ ] VoiceOver (screen reader)
- [ ] NVDA (screen reader)
- [ ] Keyboard-only navigation
- [ ] Color contrast analyzer

### Browsers Tested

- [ ] Chrome [version]
- [ ] Firefox [version]
- [ ] Safari [version]
- [ ] Edge [version]

### Devices Tested

- [ ] Desktop (Windows)
- [ ] Desktop (macOS)
- [ ] Mobile (iOS)
- [ ] Mobile (Android)

## Detailed Findings

### Critical Issues (Must Fix)

#### Issue 1: [Issue Title]

| Attribute          | Value                                 |
| ------------------ | ------------------------------------- |
| **WCAG Criteria**  | [e.g., 1.1.1 Non-text Content]        |
| **Level**          | A / AA / AAA                          |
| **Impact**         | Critical / Serious / Moderate / Minor |
| **Affected Users** | [e.g., Screen reader users]           |

**Description**: [Detailed description of the issue]

**Location**: [Page/Component/Element]

**Current Code**:

```html
<!-- Problematic code -->
```

**Recommended Fix**:

```html
<!-- Fixed code -->
```

**Screenshot/Recording**: [Attach if helpful]

---

#### Issue 2: [Issue Title]

[Repeat structure for each issue]

---

### Serious Issues

[List serious issues with same structure]

### Moderate Issues

[List moderate issues with same structure]

### Minor Issues

[List minor issues with same structure]

## Passed Criteria

### Perceivable (1.x)

- [x] 1.1.1 Non-text Content
- [x] 1.2.1 Audio-only/Video-only
- [x] 1.3.1 Info and Relationships
- [x] 1.3.2 Meaningful Sequence
- [ ] 1.4.3 Contrast (Minimum) - See Issue #X
- [x] 1.4.4 Resize Text

### Operable (2.x)

- [x] 2.1.1 Keyboard
- [x] 2.1.2 No Keyboard Trap
- [ ] 2.4.1 Bypass Blocks - See Issue #X
- [x] 2.4.2 Page Titled
- [x] 2.4.3 Focus Order
- [x] 2.4.7 Focus Visible

### Understandable (3.x)

- [x] 3.1.1 Language of Page
- [x] 3.2.1 On Focus
- [x] 3.2.2 On Input
- [x] 3.3.1 Error Identification
- [x] 3.3.2 Labels or Instructions

### Robust (4.x)

- [x] 4.1.2 Name, Role, Value
- [x] 4.1.3 Status Messages

## Recommendations

### Priority 1 (Fix Immediately)

1. [Recommendation]
2. [Recommendation]

### Priority 2 (Fix Soon)

1. [Recommendation]
2. [Recommendation]

### Priority 3 (Enhance)

1. [Recommendation]
2. [Recommendation]

## Resources

- [WCAG 2.2 Guidelines](https://www.w3.org/WAI/WCAG22/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Resources](https://webaim.org/resources/)

## Sign-off

| Role          | Name | Signature | Date |
| ------------- | ---- | --------- | ---- |
| Auditor       |      |           |      |
| Reviewer      |      |           |      |
| Product Owner |      |           |      |

---

_This audit is based on WCAG 2.2 Level AA criteria. Compliance with this audit does not guarantee full accessibility, as some aspects require ongoing testing with real users of assistive technologies._
