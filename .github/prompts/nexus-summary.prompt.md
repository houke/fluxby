---
name: nexus-summary
description: Get a summary of everything we have vs everything we need for features
agent: Nexus
model: Claude Sonnet 4.5
tools:
  [
    'vscode',
    'execute',
    'read',
    'edit',
    'search',
    'web',
    'agent',
    'filesystem/*',
    'sequential-thinking/*',
    'playwright/*',
    'todo',
  ]
---

# Project Summary Orchestrator

> **ORCHESTRATOR ONLY**: This prompt is designed exclusively for the **@Nexus** agent. If you are not **@Nexus**, please delegate this task to them.

You are the **Summary Orchestrator**. Compare "Everything we have" vs "Everything we need". Use any of the agents defined in the .github/agents/ directory to help you gather information about the current state of the project and run them as subagents if needed.

## ⚠️ REQUIRED: Read Nexus Configuration

**BEFORE starting**, read the `.nexusrc` file to get the Nexus repository path:

```bash
if [ -f ".nexusrc" ]; then
  source .nexusrc
  echo "✅ Nexus repo path: $NEXUS_REPO_PATH"
else
  echo "❌ .nexusrc not found. Run nexus-init first."
  exit 1
fi
```

Store this path - you'll use it to access templates: `$NEXUS_REPO_PATH/.nexus/templates/`

## Data Sources

Analyze the following to understand current state:

- **Feature folders**: `.nexus/features/*/` - All planned and implemented features
- **Execution logs**: `.nexus/features/*/execution.md` - Details of implemention and files modified
- **Master TOC**: `.nexus/toc.md` - Feature status overview
- **Agent definitions**: `.github/agents/` - Available expertise

## Feature Status Tracking

**REQUIRED**: Read all feature plans and extract their status from frontmatter:

- `status: "draft"` - Not yet started (needs execution)
- `status: "in-progress"` - Currently being implemented
- `status: "review"` - Under code review
- `status: "complete"` - Reviewed and finished
- `status: "on-hold"` - Paused
- `status: "archived"` - No longer relevant

**Show a table** of all features with their current status. Highlight any `draft` or `in-progress` features as requiring attention.

## Output Structure

### Feature Status Overview

```markdown
| Feature    | Status      | Progress | Last Updated | Notes               |
| ---------- | ----------- | -------- | ------------ | ------------------- |
| user-auth  | complete    | 100%     | 2026-01-25   | ✅ Reviewed         |
| data-sync  | in-progress | 60%      | 2026-01-26   | 🔄 Needs completion |
| snake-game | draft       | 0%       | 2026-01-20   | ⏸️ Not started      |
```

### Touched Files Overview

**REQUIRED**: Extract all files modified during implementation from `execution.md` logs or git history.

```markdown
| File Path           | Feature   | Status   | Last Modified |
| ------------------- | --------- | -------- | ------------- |
| src/auth/service.ts | user-auth | verified | 2026-01-25    |
| src/sync/engine.ts  | data-sync | unstable | 2026-01-26    |
| tests/auth.spec.ts  | user-auth | verified | 2026-01-25    |
```

### What We Have

- Implemented features
- Existing infrastructure
- Available agents and skills

### What We Need

- Missing features (check feature plans)
- Planned but not started items
- Gaps in resources or expertise

### Next Steps

- Recommended immediate actions
- **Incomplete features**: [List features needing work]

## Feature-Based Output Protocol

### Summary Document Location

If creating a feature-specific summary, write to:

```
.nexus/features/<feature-slug>/summary.md
```

If creating a project-wide summary, write to:

```
.nexus/features/_nexus-summary/summary.md
```

Use the template from `$NEXUS_REPO_PATH/.nexus/templates/summary.template.md`.

To read it:

```bash
cat $NEXUS_REPO_PATH/.nexus/templates/summary.template.md
```

### Update Master TOC

**REQUIRED**: After creating a summary:

1. If feature-specific: Add `summary` to that feature's Files column
2. Update Last Edited date
3. **ALWAYS** add an initial entry to the "## Revision History" section with current timestamp (format: YYYY-MM-DD HH:MM:SS), agent @summary-orchestrator (or @orchestrator if made directly from main chat), and description "Initial summary created".
4. Add any agents who contributed to the summary

## Document Structure

```markdown
---
feature: <feature-slug> | _nexus-summary
date: [YYYY-MM-DD]
agents: [@agent1, @agent2, ...]
---

# Summary: [Title]

## Executive Summary

[2-3 paragraph high-level overview of current state]

## Feature Status

[Table of all features and their status]

## Touched Files

[Table of all files modified for each feature]

## What We Have

[Detailed breakdown of implemented features, infrastructure, and capabilities]

## What We Need

[Gap analysis: missing features, planned items, resource needs]

## Progress Metrics

[Quantitative progress if available: % complete, test coverage, etc.]

## Agent Assessments

### @agent-name Assessment

[Their view of the current state from their expertise]

...

## Recommended Next Steps

[Prioritized action items]
```

## Example Summary

```markdown
# Project Summary: 2026-01-26

## Feature Status

| Feature       | Status         | Progress | Blockers           |
| ------------- | -------------- | -------- | ------------------ |
| user-auth     | ✅ complete    | 100%     | None               |
| data-sync     | 🔄 in-progress | 60%      | API design pending |
| notifications | 📝 draft       | 0%       | Waiting for auth   |

## Touched Files

| File Path           | Feature   | Status   | Last Modified |
| ------------------- | --------- | -------- | ------------- |
| src/auth/service.ts | user-auth | verified | 2026-01-25    |
| src/sync/engine.ts  | data-sync | unstable | 2026-01-26    |

## What We Have

- ✅ User authentication (login, register, sessions)
- ✅ Basic UI components
- ✅ Database schema

## What We Need

- ⏳ Data synchronization engine
- ⏳ Push notifications
- ⏳ Offline support

## Next Steps

1. Complete data-sync feature (60% → 100%)
2. Begin notifications feature
3. Schedule security review for auth
```

## Mandatory User Satisfaction Verification

**AFTER** generating the summary, verify user satisfaction using `ask_questions` tool:

```javascript
ask_questions({
  questions: [
    {
      header: 'Satisfied?',
      question:
        "Does this summary accurately reflect the project status? (Select 'Other' to provide specific feedback)",
      allowFreeformInput: true,
      options: [{ label: 'Yes, summary is accurate!' }],
    },
  ],
});
```

### Handling User Feedback

- **If user selects "Yes"**: Summary is complete, write to feature folder
- **If user provides feedback (Other/free input)**:
  1. Analyze the feedback to understand what's missing or incorrect
  2. Determine which agent(s) need to provide additional analysis
  3. Delegate using `runSubagent` to gather updated information
  4. Revise the summary with the new information
  5. Ask satisfaction question again
  6. Repeat until user is satisfied

**ONLY** after user confirms satisfaction should you:

- Write the summary to the feature folder
- Update toc.md
- Add revision history entry
