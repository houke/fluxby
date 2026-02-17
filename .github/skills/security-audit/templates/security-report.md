# Security Audit Report Template

## Executive Summary

| Field              | Value                                      |
| ------------------ | ------------------------------------------ |
| Application        | [Name]                                     |
| Version            | [X.X.X]                                    |
| Audit Date         | [YYYY-MM-DD]                               |
| Auditor            | [Name/Team]                                |
| Overall Risk Level | 🔴 Critical / 🟠 High / 🟡 Medium / 🟢 Low |

### Key Findings Summary

| Severity      | Count | Status             |
| ------------- | ----- | ------------------ |
| Critical      | [X]   | [X Fixed / Y Open] |
| High          | [X]   | [X Fixed / Y Open] |
| Medium        | [X]   | [X Fixed / Y Open] |
| Low           | [X]   | [X Fixed / Y Open] |
| Informational | [X]   | -                  |

---

## Scope

### In Scope

- [Component/feature 1]
- [Component/feature 2]
- [API endpoints]

### Out of Scope

- [Third-party services]
- [Infrastructure]

### Methodology

- [ ] Static code analysis
- [ ] Dynamic testing
- [ ] Dependency scanning
- [ ] Manual code review
- [ ] Penetration testing

---

## Findings

### [FINDING-001] [Title]

| Field      | Value              |
| ---------- | ------------------ |
| Severity   | 🔴 Critical        |
| Category   | [OWASP Category]   |
| CVSS Score | [X.X]              |
| Status     | 🔓 Open / 🔒 Fixed |
| CWE        | [CWE-XXX]          |

#### Description

[Detailed description of the vulnerability]

#### Affected Components

- [File/component 1]
- [File/component 2]

#### Steps to Reproduce

1. [Step 1]
2. [Step 2]
3. [Step 3]

#### Evidence

```
[Code snippet, request/response, screenshot reference]
```

#### Impact

[Business and technical impact of exploitation]

#### Recommendation

[Specific remediation steps]

```typescript
// Example fix
[Code example]
```

#### References

- [CVE/advisory links]
- [Documentation links]

---

### [FINDING-002] [Title]

[Repeat format for each finding...]

---

## Security Checklist

### Authentication & Authorization

| Control                               | Status   | Notes |
| ------------------------------------- | -------- | ----- |
| Strong password policy enforced       | ✅/❌/⚠️ |       |
| MFA available/required                | ✅/❌/⚠️ |       |
| Session management secure             | ✅/❌/⚠️ |       |
| JWT implementation secure             | ✅/❌/⚠️ |       |
| Authorization checks on all endpoints | ✅/❌/⚠️ |       |
| IDOR vulnerabilities addressed        | ✅/❌/⚠️ |       |

### Input Validation

| Control                        | Status   | Notes |
| ------------------------------ | -------- | ----- |
| Server-side validation present | ✅/❌/⚠️ |       |
| SQL injection prevented        | ✅/❌/⚠️ |       |
| XSS prevented                  | ✅/❌/⚠️ |       |
| Command injection prevented    | ✅/❌/⚠️ |       |
| File upload validation         | ✅/❌/⚠️ |       |
| Path traversal prevented       | ✅/❌/⚠️ |       |

### Data Protection

| Control                                   | Status   | Notes |
| ----------------------------------------- | -------- | ----- |
| HTTPS enforced                            | ✅/❌/⚠️ |       |
| Sensitive data encrypted at rest          | ✅/❌/⚠️ |       |
| Passwords properly hashed (bcrypt/argon2) | ✅/❌/⚠️ |       |
| No secrets in code/logs                   | ✅/❌/⚠️ |       |
| PII handling compliant                    | ✅/❌/⚠️ |       |

### Security Headers

| Header                    | Status | Value    |
| ------------------------- | ------ | -------- |
| Content-Security-Policy   | ✅/❌  | [Policy] |
| X-Content-Type-Options    | ✅/❌  | nosniff  |
| X-Frame-Options           | ✅/❌  | DENY     |
| Strict-Transport-Security | ✅/❌  | [Value]  |
| Referrer-Policy           | ✅/❌  | [Value]  |

### Dependencies

| Check                                | Status   | Notes |
| ------------------------------------ | -------- | ----- |
| No known vulnerabilities (npm audit) | ✅/❌/⚠️ |       |
| Dependencies up to date              | ✅/❌/⚠️ |       |
| Lock files in use                    | ✅/❌/⚠️ |       |
| SRI for CDN resources                | ✅/❌/⚠️ |       |

### Logging & Monitoring

| Control                           | Status   | Notes |
| --------------------------------- | -------- | ----- |
| Security events logged            | ✅/❌/⚠️ |       |
| Logs don't contain sensitive data | ✅/❌/⚠️ |       |
| Audit trail for critical actions  | ✅/❌/⚠️ |       |
| Alerting configured               | ✅/❌/⚠️ |       |

---

## Dependency Vulnerabilities

| Package   | Current | Vulnerable | Severity       | Fix Version |
| --------- | ------- | ---------- | -------------- | ----------- |
| [package] | [X.X.X] | [Y.Y.Y]    | [High/Med/Low] | [Z.Z.Z]     |

---

## Recommendations Summary

### Immediate (Critical/High)

1. [Action 1]
2. [Action 2]

### Short-term (Medium)

1. [Action 1]
2. [Action 2]

### Long-term (Low/Best Practices)

1. [Action 1]
2. [Action 2]

---

## Remediation Tracking

| Finding ID  | Title   | Severity | Owner  | Due Date | Status      |
| ----------- | ------- | -------- | ------ | -------- | ----------- |
| FINDING-001 | [Title] | Critical | [Name] | [Date]   | Open        |
| FINDING-002 | [Title] | High     | [Name] | [Date]   | In Progress |

---

## Appendix

### A. Tools Used

- [Tool 1] - [Version]
- [Tool 2] - [Version]

### B. Test Credentials

- [If applicable, list test accounts used]

### C. Environment Details

- [Node.js version]
- [Framework versions]
- [Database version]

### D. References

- OWASP Top 10: https://owasp.org/Top10/
- CWE: https://cwe.mitre.org/
- CVSS Calculator: https://www.first.org/cvss/calculator/3.1
