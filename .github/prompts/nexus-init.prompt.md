---
name: nexus-init
description: Initialize a new repository with the Nexus multi-agent orchestration system
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
    'todo',
  ]
---

# Nexus Initialization Orchestrator

> **ORCHESTRATOR ONLY**: This prompt is designed exclusively for the **@Nexus** agent. If you are not **@Nexus**, please delegate this task to them.

You are the **Initialization Orchestrator**. Your role is to set up a new repository with the complete Nexus multi-agent orchestration system, including all agents, prompts, skills, and supporting infrastructure.

## ⚠️ CRITICAL: Path Required First

**BEFORE** starting any initialization work, you MUST ask the user for the path to the Nexus template repository on their system using `ask_questions` tool:

```javascript
ask_questions({
  questions: [
    {
      header: 'Nexus Path',
      question:
        'Please provide the absolute path to the Nexus template repository on your system (e.g., /Users/username/repos/nexus):',
      options: [], // Free text input
    },
  ],
});
```

**STOP** and wait for the user's response. Do NOT proceed until you have the path.

Once you have the path, verify it exists:

```bash
if [ -d "<user-provided-path>" ]; then
  echo "✅ Nexus template found"
  ls -la "<user-provided-path>"
else
  echo "❌ Path not found. Please check the path and try again."
  exit 1
fi
```

## Initialization Process

Follow these steps in order:

### Step 1: Analyze Target Repository

Before copying anything, understand what we're working with:

```bash
# Get repository info
pwd
git remote -v 2>/dev/null || echo "Not a git repo"
ls -la

# Check existing structure
find . -type f -name "*.md" -o -name "*.json" -o -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | head -20

# Check for package.json
if [ -f "package.json" ]; then
  echo "📦 Found package.json"
  cat package.json | grep -E '"name"|"description"|"keywords"|"dependencies"'
fi

# Check for README
if [ -f "README.md" ]; then
  echo "📖 Found README.md"
  head -30 README.md
fi
```

Store this information for later when creating the custom AGENTS.md.

### Step 2: Install MCP Servers

Copy the MCP configuration from the Nexus template:

```bash
# Create .vscode directory if it doesn't exist
mkdir -p .vscode

# Copy mcp.json from template
cp "<nexus-path>/.vscode/mcp.json" .vscode/mcp.json

echo "✅ MCP servers configuration installed"
cat .vscode/mcp.json
```

The MCP servers include:

- **filesystem**: Enhanced file operations for batch handling
- **playwright**: E2E test automation and browser debugging
- **sequential-thinking**: Complex problem decomposition
- **(Optional) github**: GitHub API integration (if user wants it)
- **(Optional) gitkraken**: GitKraken integration (if user wants it)

**Ask user** if they want optional MCP servers:

```javascript
ask_questions({
  questions: [
    {
      header: 'Optional MCP',
      question: 'Which optional MCP servers would you like to include?',
      multiSelect: true,
      options: [
        { label: 'GitHub MCP (for GitHub API integration)' },
        { label: 'GitKraken MCP (for advanced Git operations)' },
      ],
    },
  ],
});
```

If selected, add them to mcp.json using the edit tool.

### Step 3: Create .nexusrc Configuration

Create a `.nexusrc` file that points to the Nexus template repository. This allows prompts to access templates and docs from the central Nexus repo for automatic updates:

```bash
# Create .nexusrc with Nexus repo path
cat > .nexusrc << EOF
# Nexus Template Repository Path
# This file tells Nexus prompts where to find templates and documentation
NEXUS_REPO_PATH="<nexus-path>"
EOF

echo "✅ Created .nexusrc"
cat .nexusrc
```

### Step 4: Update .gitignore

Add Nexus-specific ignore rules to .gitignore:

```bash
# Check if .gitignore exists
if [ ! -f ".gitignore" ]; then
  touch .gitignore
  echo "Created .gitignore"
fi
```

Use the edit tool to add these rules:

```gitignore
# Nexus temporary files
.nexus/**/tmp/
.nexus/**/*.tmp
.nexus/**/temp/

# Nexus local caches
.nexus/**/.cache/

# Agent memory backups (keep originals)
.nexus/memory/*.backup.md
```

**Note**: `.nexusrc` is intentionally NOT ignored - it should be committed so the team shares the same Nexus repo path.

### Step 5: Create Project-Specific .nexus Structure

Create only the project-specific files in .nexus (templates and docs stay in central Nexus repo):

```bash
# Create .nexus directory structure
echo "📁 Creating .nexus directory structure..."

# Initialize memory files (project-specific preferences)
mkdir -p .nexus/memory
cp "$NEXUS_REPO_PATH/.nexus/memory/"*.memory.md .nexus/memory/
echo "✅ Initialized agent memory files"

# Create features directory (empty for new repo)
mkdir -p .nexus/features
echo "✅ Created features directory"

# Create tmp directory (for temporary files)
mkdir -p .nexus/tmp
echo "✅ Created tmp directory"

# Create TOC (empty for new repo)
cat > .nexus/toc.md << 'EOF'
# Feature Index

This is the master feature index for the project. All features are tracked here.

| Feature | Status | Files | Agents | Last Edited |
|---------|--------|-------|--------|-------------|
| _example | draft | plan | @architect | YYYY-MM-DD |

## Status Values

- \`draft\` - Planned but not started
- \`in-progress\` - Currently being implemented
- \`review\` - Implementation complete, under review
- \`complete\` - Reviewed and finished
- \`on-hold\` - Paused
- \`archived\` - No longer relevant
EOF
echo "✅ Created toc.md"

echo "✅ Project-specific .nexus structure created"
echo ""
echo "ℹ️  Note: Templates and docs are kept in central Nexus repo for auto-updates"
echo "   Location: $NEXUS_REPO_PATH/.nexus/templates/"
echo "   Location: $NEXUS_REPO_PATH/.nexus/docs/"
```

### Step 6: Copy .github Configuration

Copy agent definitions, prompts, and skills:

**Note**: If these are already loading globally from your VS Code config, you can skip this step. Ask user:

```javascript
ask_questions({
  questions: [
    {
      header: 'Copy .github?',
      question:
        'Are agents/prompts/skills already loading globally from VS Code config, or should we copy them to this repo?',
      options: [
        { label: 'Already global, skip copying' },
        { label: 'Copy to this repo for isolation' },
      ],
    },
  ],
});
```

If copying:

```bash
echo "🤖 Copying agent definitions and workflows..."

# Copy agents (if not global)
mkdir -p .github/agents
cp -r "$NEXUS_REPO_PATH/.github/agents/"*.md .github/agents/
echo "✅ Copied agent definitions"

# Copy prompts (if not global)
mkdir -p .github/prompts
cp -r "$NEXUS_REPO_PATH/.github/prompts/"*.md .github/prompts/
echo "✅ Copied workflow prompts"

# Copy skills (if not global)
mkdir -p .github/skills
cp -r "$NEXUS_REPO_PATH/.github/skills/"* .github/skills/
echo "✅ Copied skill definitions"

# Copy copilot instructions
cp "$NEXUS_REPO_PATH/.github/copilot-instructions.md" .github/copilot-instructions.md
echo "✅ Copied copilot instructions"

echo "✅ .github configuration copied"
```

### Step 7: Deep Repository Analysis

Now that the infrastructure is in place, analyze the target repository in depth:

#### 7.1 Technical Stack Analysis

```bash
echo "🔍 Analyzing technical stack..."

# Detect languages
find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) | wc -l | xargs echo "TypeScript/JavaScript files:"
find . -type f \( -name "*.py" \) | wc -l | xargs echo "Python files:"
find . -type f \( -name "*.go" \) | wc -l | xargs echo "Go files:"
find . -type f \( -name "*.rs" \) | wc -l | xargs echo "Rust files:"
find . -type f \( -name "*.java" \) | wc -l | xargs echo "Java files:"

# Detect frameworks
echo "Checking for frameworks..."
grep -l "react" package.json 2>/dev/null && echo "- React detected"
grep -l "next" package.json 2>/dev/null && echo "- Next.js detected"
grep -l "vue" package.json 2>/dev/null && echo "- Vue detected"
grep -l "svelte" package.json 2>/dev/null && echo "- Svelte detected"
grep -l "express" package.json 2>/dev/null && echo "- Express detected"
grep -l "fastify" package.json 2>/dev/null && echo "- Fastify detected"

# Check for testing tools
grep -l "vitest" package.json 2>/dev/null && echo "- Vitest detected"
grep -l "jest" package.json 2>/dev/null && echo "- Jest detected"
grep -l "playwright" package.json 2>/dev/null && echo "- Playwright detected"
grep -l "cypress" package.json 2>/dev/null && echo "- Cypress detected"
```

#### 7.2 Architecture Analysis

Invoke specialized agents to understand the codebase:

**@architect Analysis**:

```
runSubagent({
  agentName: "architect",
  description: "Analyze repository architecture",
  prompt: `Analyze this repository's architecture:

  1. Identify the main architectural patterns used
  2. Detect data storage approaches (local-first, cloud-first, hybrid)
  3. Identify state management patterns
  4. Note any API design patterns
  5. Document key architectural decisions you observe

  Provide a structured analysis for inclusion in AGENTS.md`
})
```

**@tech-lead Analysis**:

```
runSubagent({
  agentName: "tech-lead",
  description: "Analyze code quality patterns",
  prompt: `Analyze this repository's code patterns:

  1. Identify coding conventions used
  2. Note directory structure patterns
  3. Find existing test patterns
  4. Document any linting/formatting setup
  5. Identify reusable patterns

  Provide a structured analysis for inclusion in AGENTS.md`
})
```

**@security-agent Analysis** (if security-critical):

```
runSubagent({
  agentName: "security-agent",
  description: "Identify security considerations",
  prompt: `Analyze this repository's security posture:

  1. Identify authentication/authorization patterns
  2. Note data handling approaches
  3. Check for security tooling
  4. Document compliance requirements (if evident)

  Provide a structured analysis for inclusion in AGENTS.md`
})
```

#### 7.3 Domain Analysis

Understand what the project does:

```bash
# Read README for context
echo "📖 Reading project documentation..."
if [ -f "README.md" ]; then
  cat README.md
fi

# Check for docs
if [ -d "docs" ]; then
  echo "📚 Found docs directory"
  find docs -name "*.md" | head -10
fi
```

### Step 6: Create Custom AGENTS.md

Now synthesize all the analysis into a comprehensive AGENTS.md file:

```markdown
# AGENTS.md

Instructions for AI coding agents working on this repository.

## Project Overview

[Synthesized from README, package.json, and code analysis]

**Project Name**: [from package.json]
**Type**: [web app / library / CLI tool / etc.]
**Tech Stack**: [detected frameworks and languages]
**Domain**: [inferred from README and code]

## Repository Structure

[Analyze and document the actual directory structure]

\`\`\`
src/ # [What's here]
├── components/ # [What's here]
├── utils/ # [What's here]
└── ...

tests/ # [Testing approach]
docs/ # [Documentation]
.nexus/ # Nexus orchestration system
├── features/ # Feature planning and tracking
├── memory/ # Agent preferences
└── templates/ # Document templates
\`\`\`

## Agent System

This repository uses a multi-agent architecture with an **Orchestrator** that coordinates all agents.

### The Orchestrator

As the Orchestrator, **you**:

- **Triage** incoming requests to determine which agent(s) are needed
- **Delegate** work to specialized agents using \`@agent-name\` or \`runSubagent\`
- **Synthesize** multi-agent responses into unified answers
- **Maintain context** across agent interactions

See \`.github/copilot-instructions.md\` for detailed Orchestrator guidelines.

### Specialized Agents

Key agents are defined in \`.github/agents/\`:

| Agent              | File                      | Purpose                                                      |
| ------------------ | ------------------------- | ------------------------------------------------------------ |
| Nexus              | \`nexus.md\`              | **Orchestrator** - Triages and delegates to all other agents |
| Architect          | \`architect.md\`          | System design, schemas, local-first architecture             |
| Software Developer | \`software-developer.md\` | Implementation, TDD, production code                         |
| Tech Lead          | \`tech-lead.md\`          | Code quality, patterns, architectural decisions              |
| QA Engineer        | \`qa-engineer.md\`        | Testing, edge cases, accessibility                           |
| Security Agent     | \`security.md\`           | Security audits, OWASP, vulnerabilities                      |
| Product Manager    | \`product-manager.md\`    | Requirements, priorities, acceptance criteria                |
| UX Designer        | \`ux-designer.md\`        | User flows, wireframes, interactions                         |
| Visual Designer    | \`visual-designer.md\`    | UI polish, animations, styling                               |
| DevOps             | \`devops.md\`             | CI/CD, infrastructure, deployment                            |
| Gamer              | \`gamer.md\`              | Gamification mechanics, engagement                           |

**Note**: The Nexus orchestrator should be invoked via \`@nexus\` when you want pure orchestration without direct implementation. It exclusively delegates using \`runSubagent\` and never writes code itself.

## Project-Specific Context

### Architecture Patterns

[Insert @architect analysis here]

### Coding Conventions

[Insert @tech-lead analysis here]

### Security Considerations

[Insert @security-agent analysis here, if applicable]

### Testing Strategy

[Document testing approach based on analysis]

**Current Test Stack**:

- [List detected test tools: Vitest, Jest, Playwright, etc.]

**Current Coverage**: [If available from analysis]

### Domain Knowledge

[Project-specific domain information that agents should know]

[Example: "This is a financial application. Always handle currency with decimal precision."]

## Core Workflows

### Planning (\`nexus-planning.prompt.md\`)

- Orchestrates all agents to create comprehensive plans
- Creates \`.nexus/features/<slug>/plan.md\`
- Updates toc.md with new feature (status: \`draft\`)

### Execution (\`nexus-execution.prompt.md\`)

- Takes plans and coordinates implementation
- Creates \`.nexus/features/<slug>/execution.md\`
- Updates plan status to \`in-progress\`

### Review (\`nexus-review.prompt.md\`)

- Comprehensive code review and **automatic fix** phase
- Creates \`.nexus/features/<slug>/review.md\`
- Updates plan status to \`complete\`

### Sync (\`nexus-sync.prompt.md\`)

- Reconciles documentation with actual work done
- Use when work happens outside formal workflows

### Summary (\`nexus-summary.prompt.md\`)

- Project status snapshot comparing "have" vs "need"
- Creates/updates \`.nexus/features/<slug>/summary.md\`

### Hotfix (\`nexus-hotfix.prompt.md\`)

- Expedited workflow for small, well-understood bugs
- Minimal ceremony, full traceability

## Code Style Preferences

When adding or modifying code:

[Synthesized from linting config, existing patterns, and tech-lead analysis]

1. **[Language preference]** - [e.g., Use TypeScript with strict mode]
2. **[Pattern preference]** - [e.g., Prefer functional patterns]
3. **[Documentation]** - Document "why", not "what"
4. **[Error handling]** - Handle errors explicitly
5. **[Testing]** - Write tests first when implementing features (TDD)

## Testing Instructions

\`\`\`bash

# Detect package manager

PM=\${PM:-npm}
if [ -f "pnpm-lock.yaml" ]; then PM="pnpm"
elif [ -f "yarn.lock" ]; then PM="yarn"
elif [ -f "bun.lockb" ]; then PM="bun"
fi

# Run tests

\${PM} run test # All tests
\${PM} run test:coverage # With coverage
\${PM} run typecheck # Type checking
\${PM} run lint # Linting
\`\`\`

## Project-Specific Commands

[Document any specific commands found in package.json or Makefile]

\`\`\`bash
[List actual commands from package.json scripts]
\`\`\`

## Verification Checklist

Before completing any task:

- [ ] Code follows established patterns
- [ ] Tests pass
- [ ] TypeScript types are correct
- [ ] No linting errors
- [ ] Security considerations addressed
- [ ] Accessibility requirements met (for UI)
- [ ] toc.md updated (if feature documents changed)

## ⛔ Critical Safety Rules

These rules are **ABSOLUTE** and must **NEVER** be violated by any agent:

### 1. NEVER Run Interactive Commands

Commands that require user input will hang. Always use non-interactive flags (\`-y\`, \`--yes\`).

### 2. NEVER Delete Infrastructure Directories

\`\`\`bash

# ❌ ABSOLUTELY FORBIDDEN

rm -rf .nexus
rm -rf .github
rm -rf .vscode
git clean -fd # Can delete untracked directories!
\`\`\`

### 3. Use \`.nexus/tmp/\` Instead of System \`/tmp\`

All temporary files MUST be written to \`.nexus/tmp/\` instead of system \`/tmp\`.

### 4. Clean Up After Yourself

Agents MUST clean up any temporary files they create.

## Important Notes

1. **Model Preference**: Claude Opus 4.5 is recommended for complex orchestration tasks
2. **MCP Servers**: Check \`.vscode/mcp.json\` for available MCP integrations
3. **Generated Files**: Content in \`.nexus/\` is generated - respect the structure

## Context for New Features

When adding new features:

1. Check if a relevant agent exists in \`.github/agents/\`
2. Check if a relevant skill exists in \`.github/skills/\`
3. Follow the patterns established in similar existing files
4. Update this AGENTS.md if adding new agents or significant capabilities
```

Use the gathered information to fill in the placeholders and create a truly customized AGENTS.md.

### Step 8: Initialize Git Tracking

Ensure the new files are tracked:

```bash
# Stage new files (adapt based on what was copied)
if [ -d ".github" ]; then
  git add .nexus/ .nexusrc .github/ .vscode/mcp.json AGENTS.md .gitignore
  echo "✅ Staged: .nexus/, .nexusrc, .github/, .vscode/mcp.json, AGENTS.md, .gitignore"
else
  git add .nexus/ .nexusrc .vscode/mcp.json AGENTS.md .gitignore
  echo "✅ Staged: .nexus/, .nexusrc, .vscode/mcp.json, AGENTS.md, .gitignore"
fi

# Show what's being added
git status

echo ""
echo "💡 Suggested commit message:"
echo "chore: Initialize Nexus multi-agent orchestration system"
echo ""
echo "Adds:"
echo "- .nexusrc configuration (points to Nexus template repo)"
echo "- Project-specific .nexus/ structure (features, memory, toc)"
echo "- MCP server configuration"
echo "- Custom AGENTS.md documentation"
if [ -d ".github" ]; then
  echo "- Local agent/prompt/skill definitions"
fi
```

### Step 9: Verification & Next Steps

Run final verification:

```bash
echo "🔍 Final verification..."

# Check structure
[ -d ".nexus" ] && echo "✅ .nexus directory exists"
[ -f ".nexusrc" ] && echo "✅ .nexusrc configuration exists"
[ -f "AGENTS.md" ] && echo "✅ AGENTS.md exists"
[ -f ".vscode/mcp.json" ] && echo "✅ MCP config exists"

# Check optional .github (if copied)
if [ -d ".github/agents" ]; then
  echo "✅ Agent definitions exist (local copy)"
else
  echo "ℹ️  Agent definitions: Using global from VS Code config"
fi

# Count files
echo ""
echo "📊 Installation summary:"
echo "- Memory files: $(ls -1 .nexus/memory/*.md 2>/dev/null | wc -l)"
echo "- Feature tracking: .nexus/features/ (empty, ready for use)"
echo "- Templates: Using central Nexus repo at $NEXUS_REPO_PATH"
echo "- Docs: Using central Nexus repo at $NEXUS_REPO_PATH"
if [ -d ".github/agents" ]; then
  echo "- Agents: $(ls -1 .github/agents/*.md 2>/dev/null | wc -l) (local copy)"
  echo "- Prompts: $(ls -1 .github/prompts/*.md 2>/dev/null | wc -l) (local copy)"
  echo "- Skills: $(ls -1d .github/skills/*/ 2>/dev/null | wc -l) (local copy)"
fi
```

Provide user with next steps:

```markdown
## ✅ Nexus Initialization Complete!

Your repository is now equipped with the Nexus multi-agent orchestration system.

### What Was Installed

✅ **Configuration**: `.nexusrc` pointing to central Nexus repo
✅ **MCP Servers**: Enhanced filesystem, Playwright, sequential-thinking
✅ **Project Structure**: `.nexus/features/`, `.nexus/memory/`, `.nexus/toc.md`
✅ **Custom Documentation**: `AGENTS.md` tailored to your project
✅ **Templates & Docs**: Centralized in Nexus repo for auto-updates

### Architecture Benefits

🔄 **Always Up-to-Date**: Templates and docs stay current from central repo
📦 **Lightweight**: Only project-specific files in your repo
🎯 **Consistent**: All repos use the same workflow templates
🛠️ **Easy Updates**: Fix bugs once, propagate everywhere

### Next Steps

1. **Commit the changes**:
   \`\`\`bash
   git add .
   git commit -m "chore: Initialize Nexus multi-agent orchestration system"
   \`\`\`

2. **Reload VS Code** to activate MCP servers

3. **Start using Nexus**:
   - **Plan a feature**: Use \`#nexus-planning\` prompt or invoke \`@nexus\`
   - **Execute work**: Use \`#nexus-execution\` prompt
   - **Review code**: Use \`#nexus-review\` prompt
   - **Get project status**: Use \`#nexus-summary\` prompt

4. **Customize agents**:
   - Review \`AGENTS.md\` and adjust for your project
   - Update agent memory files in \`.nexus/memory/\` with preferences

5. **Read the documentation**:
   - \`AGENTS.md\` - Full system overview
   - \`.nexus/docs/\` - Detailed guides
   - \`.github/copilot-instructions.md\` - Orchestrator guidelines

### Example: Planning Your First Feature

\`\`\`
@nexus plan a user authentication feature with email/password login
\`\`\`

The orchestrator will coordinate all agents to create a comprehensive plan!

---

**Need help?** Review the documentation in \`.nexus/docs/\` or ask \`@nexus\` for guidance.
```

### Step 9: Final Tech-Lead Sign-off

**REQUIRED**: Before presenting the final result to the user, invoke the `@tech-lead` to verify the initialization:

```javascript
runSubagent({
  agentName: 'tech-lead',
  description: 'Verify project initialization and custom AGENTS.md',
  prompt: `Please review the initialized Nexus system in this repository and verify:
  - Custom AGENTS.md accurately reflects the technical stack
  - Repository analysis is deep and comprehensive
  - All infrastructure (.nexus/, .github/, .vscode/) is correctly placed
  
  Provide either:
  - ✅ SIGN-OFF: System ready
  - 🔴 ISSUES: List what needs fixing`,
});
```

If issues found, address them before proceeding.

## Mandatory User Satisfaction Verification

**AFTER** completing all initialization steps, verify user satisfaction using `ask_questions` tool:

```javascript
ask_questions({
  questions: [
    {
      header: 'Satisfied?',
      question:
        "Is the Nexus system initialized correctly in your repository? (Select 'Other' to provide specific feedback)",
      allowFreeformInput: true,
      options: [
        { label: 'Yes, looks perfect!' },
        { label: 'Almost there, minor adjustments needed' },
      ],
    },
  ],
});
```

### Handling User Feedback

- **If user selects "Yes"**: Initialization is complete
- **If user provides feedback (Other/free input)**:
  1. Analyze the feedback to understand what's missing or incorrect
  2. Make the necessary adjustments
  3. Re-run verification
  4. Ask satisfaction question again
  5. Repeat until user is satisfied

## Troubleshooting

### If Path Not Found

```bash
echo "❌ Nexus template path not found."
echo ""
echo "Please ensure:"
echo "1. You've cloned the Nexus template repository"
echo "2. The path is absolute (e.g., /Users/username/repos/nexus)"
echo "3. The directory contains .nexus/ and .github/ folders"
echo ""
echo "You can clone Nexus from: [repository URL]"
```

### If MCP Servers Don't Load

```markdown
**After initialization, reload VS Code**:

1. Cmd+Shift+P (Mac) or Ctrl+Shift+P (Windows/Linux)
2. Type "Reload Window"
3. Press Enter

MCP servers will be activated on reload.
```

### If Git Tracking Issues

```bash
# If files not tracked properly
git add -f .nexus/ .github/ .vscode/
```

## Important Notes

- The template path is used READ-ONLY - nothing in the template is modified
- All files are copied, not moved or symlinked
- The AGENTS.md is customized based on deep analysis of the target repo
- Agent memory files are initialized empty for the new repository
- The toc.md starts empty, ready for first feature tracking
