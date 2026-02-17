---
name: nexus-review
description: Run a code review using all agent personas from .github/agents
agent: Nexus
model: Claude Opus 4.5
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

# Comprehensive Code Review & Fix

> **ORCHESTRATOR ONLY**: This prompt is designed exclusively for the **@Nexus** agent. If you are not **@Nexus**, please delegate this task to them.

You are the **Review Orchestrator**. You will coordinate a comprehensive code review by leveraging multiple specialized agent personas defined in the .github/agents directory. **This is not a passive review—each agent MUST fix the issues they find.**

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

## Review & Fix Philosophy

> "Don't just report problems, solve them."

Each agent reviews the codebase through their lens of expertise, identifies issues, and **immediately fixes them**. The final report documents what was found AND what was fixed.

## ⛔ CRITICAL SAFETY RULES

These rules are ABSOLUTE and must NEVER be violated:

### 1. NEVER Run Interactive Commands

**FORBIDDEN** - Commands that require user input or run in interactive mode:

```bash
# ❌ NEVER DO THIS
npm init                     # Interactive - asks questions
pnpm init                    # Interactive - asks questions
yarn init                    # Interactive - asks questions
bun init                     # May ask questions
git clean -i                 # Interactive clean
playwright show-report       # Starts server, hangs waiting for Ctrl+C
npm run dev                  # Starts dev server, blocks terminal
any server/watch command     # Unless explicitly needed and isBackground=true
```

Always use non-interactive alternatives (`-y`, `--yes` flags) or skip and document for manual execution.

### 2. NEVER Delete or Clean the `.nexus/` Directory

The `.github`, `.nexus/` and `.vscode` directories contains critical project artifacts. **NEVER**:

```bash
# ❌ ABSOLUTELY FORBIDDEN
rm -rf .nexus
git clean -fd                # Can delete .nexus if untracked!
git reset --hard             # Can lose .nexus changes
```

### 3. Handle "Dirty" Directories Safely

If the working directory has uncommitted changes:

- **DO NOT** auto-clean or reset
- Use `git stash` to preserve changes if needed
- **When in doubt, STOP and ask the user**

## Context Gathering (REQUIRED)

**Before starting any review**, you MUST read the feature documentation:

1. **Read the Plan**: `.nexus/features/<slug>/plan.md`
   - Understand the original requirements and decisions
   - Note any Q&A that was resolved during planning
   - Check for questions deferred to execution

2. **Read the Execution Log**: `.nexus/features/<slug>/execution.md`
   - Understand what was actually implemented
   - Note any deviations from the plan
   - Check for questions resolved during execution (🔧)
   - Review any challenges and decisions made

This context is essential for understanding **why** decisions were made, not just **what** was implemented.

## Process

For each agent persona defined in the .github/agents directory, you will:

1. **Invoke a subagent** using the specific agent persona.
2. **Request a detailed review** from that subagent with focus on their "Focus Areas" and "Guidelines".
3. **Instruct the agent to FIX** every issue they find:

- Apply code changes directly using edit tools
- Follow TDD: write/update tests for fixes
- Run verification after fixes: `${PM:-npm} run test && ${PM:-npm} run lint && ${PM:-npm} run typecheck`

4. **Document both findings AND fixes** in their report section.

5. **Synthesis**:
   - Collect all agent review reports.
   - Consolidate into the review document at `.nexus/features/<slug>/review.md` using the template structure.
   - Update the plan status to `complete` when review is finished.
   - Update toc.md with the new status and files.
   - **ALWAYS** append an entry to the "## Revision History" section when creating or updating the review with current timestamp (format: YYYY-MM-DD HH:MM:SS), agent identifier (@review-orchestrator or @orchestrator if from main chat, or specific @agent-name), and a brief description of what was reviewed/changed.
6. **ALWAYS** write the final review to the feature folder.

## Agent Fix Instructions

When delegating to each agent, include these instructions:

```markdown
## Review & Fix Task for @[agent-name]

**Mode**: ACTIVE FIX (not passive review)

**Your Mission**:

1. Review the codebase through your expertise lens
2. For EACH issue you find:

- Document the issue (what, where, why it matters)
- FIX IT immediately using edit tools
- Document your fix (what you changed, why)
- Verify the fix works

3. Run verification: `npm run test && npm run lint && npm run typecheck`
4. Report: findings + fixes applied

**Do NOT**: Create a list of "recommendations" without fixing them.
**DO**: Fix everything within your expertise that you can fix.
**EXCEPTION**: If a fix requires cross-cutting changes outside your expertise,
flag it for another agent but still propose the fix.
```

## Verification Gate

After ALL agents complete their review-and-fix passes:

```bash
# Use your package manager (npm, pnpm, yarn, or bun)
npm run test        # All tests pass
npm run lint        # No lint errors
npm run typecheck   # No type errors
```

If any fail, coordinate fixes before finalizing the report.

## Final Output

The report should include:

- An introduction stating the purpose of the review and the agents involved.
- Individual sections for each agent showing:
  - **Issues Found**: What they discovered
  - **Fixes Applied**: What they changed (with file references)
  - **Verification**: Test/lint/typecheck results after their fixes
  - **Deferred Items**: Issues requiring other agents (if any)
- A summary of total issues found, fixed, and overall codebase health improvement.

Ensure that each subagent adheres to their defined "Focus Areas" and "Guidelines" when conducting their review.

## Question Resolution Protocol

During review, questions may arise about implementation decisions, architecture choices, or code patterns. Follow this protocol:

### When Questions Arise

1. **Check Existing Documentation First**
   - Review the plan's Q&A sections (resolved during planning ✅ and execution 🔧)
   - Check execution.md for "Challenges & Decisions" that may explain the choice
   - The answer may already be documented

2. **Route to the Appropriate Agent**
   - Implementation questions → @software-developer who wrote it, or @tech-lead
   - Architecture questions → @architect
   - UX decisions → @ux-designer
   - Security choices → @security-agent

3. **Wait for Answer** — Do NOT proceed with review conclusions until questions are answered

4. **Document the Exchange**
   - Log both question AND answer in the review document
   - Include: Question, Answer, Answering Agent

### No Deferral Allowed

**Questions during review CANNOT be deferred** — this is the final phase.

Resolution hierarchy:

1. **Subagent expertise** — Route to the agent best qualified to answer
2. **Cross-agent discussion** — If needed, involve multiple agents
3. **User escalation (LAST RESORT)** — Only after ALL review work is complete and agents cannot resolve

### User Escalation Protocol

If you must escalate to the user:

1. **Complete all other review work first** — Do not interrupt the review flow
2. **Batch all unresolved questions** — Present them together at the end
3. **Provide context** — Include what was asked, who was consulted, why it remains unresolved
4. **Document user answers** — Add to the review Q&A section with 👤 icon

## Feature Completion

**REQUIRED**: After a successful review with all verifications passing:

1. **Update plan status**: Change `status: "in-progress"` to `status: "complete"` in the plan's frontmatter
2. **Document completion** in the review report: "Feature marked as complete"
3. **Update toc.md** with final status and review document

This closes the loop: Planning → Execution → Review → Complete.

## Feature-Based Output Protocol

### Review Document Location

Write the review to:

```
.nexus/features/<feature-slug>/review.md
```

Use the template from `$NEXUS_REPO_PATH/.nexus/templates/review.template.md`.

To read it:

```bash
cat $NEXUS_REPO_PATH/.nexus/templates/review.template.md
```

### Review Document Update Policy

**IMPORTANT**: Before creating a new review, check for existing reviews:

1. **Check if review exists**: `ls .nexus/features/<slug>/`
2. **If review.md exists** → Update it, increment `review-iteration`
3. **If no review.md** → Create it

### Updating Existing Reviews

When updating an existing review document:

1. **Preserve history**: Add a new "Review Iteration" section, don't delete previous
2. **Update frontmatter**: Increment `review-iteration`, update `date`
3. **Add iteration header**: `## Review Iteration N - YYYY-MM-DD`
4. **Document deltas**: Focus on new findings vs previous iteration

### Update Master TOC

**REQUIRED**: Update `.nexus/toc.md`:

1. Change status from `in-progress` to `complete`
2. Add `review` to the Files column
3. Update Last Edited date

Example:

```markdown
| user-auth | complete | plan, execution, review | @architect, @software-developer, @qa-engineer | 2026-01-26 |
```

## Document Structure

```markdown
---
feature: <feature-slug>
date: [YYYY-MM-DD]
review-iteration: 1
agents: [@agent1, @agent2, ...]
issues-found: [total count]
issues-fixed: [total count]
---

# Review Report: [Feature Title]

## Summary

[2-3 paragraph executive summary: what was reviewed, total issues found/fixed, overall health improvement]

## Metrics

| Metric        | Before | After |
| ------------- | ------ | ----- |
| Issues Found  | -      | X     |
| Issues Fixed  | -      | X     |
| Test Coverage | X%     | Y%    |
| Lint Errors   | X      | 0     |
| Type Errors   | X      | 0     |

## Agent Review & Fix Reports

### @agent-name

**Focus Areas**: [their expertise]

#### Issues Found

| #   | Issue         | Severity        | File      |
| --- | ------------- | --------------- | --------- |
| 1   | [description] | high/medium/low | [file.ts] |

#### Fixes Applied

| #   | Fix Description          | Files Changed       |
| --- | ------------------------ | ------------------- |
| 1   | [what was fixed and how] | [file.ts, other.ts] |

#### Verification

- Tests: ✅ Passing
- Lint: ✅ Clean
- Types: ✅ Clean

#### Deferred Items

[Issues requiring other agents, if any]

...

## Common Themes

[Patterns that emerged across multiple reviews]

## Remaining Action Items

[Any items that could not be auto-fixed, with owners]
```

## Mandatory QA & Tech-Lead Sign-off

**AFTER** any fixes have been applied and before presenting the final report, obtain final sign-off:

### 1. QA Engineer Sign-off

Delegate to @qa-engineer using `runSubagent`:

```javascript
runSubagent({
  agentName: 'qa-engineer',
  description: 'Final quality validation after fixes',
  prompt: `Please review the final state of the feature after all review fixes and verify:
  - All automated tests passing
  - No new regressions introduced by fixes
  - Quality standards maintained
  
  Provide either:
  - ✅ SIGN-OFF: Approved
  - 🔴 ISSUES: List blockers`,
});
```

### 2. Tech Lead Sign-off

Delegate to @tech-lead using `runSubagent`:

```javascript
runSubagent({
  agentName: 'tech-lead',
  description: 'Final architectural sign-off',
  prompt: `Please review the final state of the feature after all review fixes and verify:
  - Architectural integrity maintained
  - Patterns and standards followed
  - No technical debt introduced by fixes
  
  Provide either:
  - ✅ SIGN-OFF: Approved
  - 🔴 ISSUES: List blockers`,
});
```

### 3. Resolve Sign-off issues

If any blockers are raised during sign-off, you MUST address them and re-run the sign-off cycle.

## Mandatory User Satisfaction Verification

**AFTER** completing all reviews and fixes, verify user satisfaction using `ask_questions` tool:

```javascript
ask_questions({
  questions: [
    {
      header: 'Satisfied?',
      question:
        "Are you happy with the code review and fixes? (Select 'Other' to provide specific feedback)",
      allowFreeformInput: true,
      options: [{ label: 'Yes, review looks complete!' }],
    },
  ],
});
```

### Handling User Feedback

- **If user selects "Yes"**: Review is complete, finalize the report
- **If user provides feedback (Other/free input)**:
  1. Analyze the feedback to understand concerns
  2. Determine which agent needs to address it
  3. Delegate using `runSubagent` to the appropriate agent
  4. Have them fix the issues
  5. Re-run verification (tests, lint, typecheck)
  6. Update the review report with additional fixes
  7. Ask satisfaction question again
  8. Repeat until user is satisfied

**ONLY** after user confirms satisfaction should you:

- Update toc.md status to `complete`
- Finalize the review document
- Mark the feature as done
