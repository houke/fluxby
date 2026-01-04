#!/usr/bin/env node
/**
 * Release script for Fluxby
 *
 * Usage:
 *   npm run release          # Interactive release
 *   npm run release:dry      # Dry run (no actual changes)
 *
 * This script:
 * 1. Parses conventional commits since last tag
 * 2. Determines version bump (major/minor/patch)
 * 3. Generates changelog
 * 4. Updates UpdatesContent.tsx with new release
 * 5. Updates package.json versions
 * 6. Commits changes
 * 7. Creates git tag
 * 8. Pushes to trigger release workflow
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, '..');

// Parse arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run') || args.includes('-d');
const forceVersion = args.find((a) => a.match(/^\d+\.\d+\.\d+$/));

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  console.log(`\n${colors.blue}[${step}]${colors.reset} ${message}`);
}

function exec(cmd, options = {}) {
  try {
    return execSync(cmd, {
      cwd: ROOT_DIR,
      encoding: 'utf-8',
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options,
    });
  } catch (error) {
    if (!options.ignoreError) {
      throw error;
    }
    return '';
  }
}

function execOutput(cmd) {
  return exec(cmd, { silent: true }).trim();
}

// Conventional commit types and their changelog sections
const COMMIT_TYPES = {
  feat: { title: 'Features', bump: 'minor' },
  fix: { title: 'Bug Fixes', bump: 'patch' },
  perf: { title: 'Performance Improvements', bump: 'patch' },
  refactor: { title: 'Code Refactoring', bump: 'patch' },
  docs: { title: 'Documentation', bump: 'patch' },
  style: { title: 'Styles', bump: 'patch' },
  test: { title: 'Tests', bump: 'patch' },
  build: { title: 'Build System', bump: 'patch' },
  ci: { title: 'CI/CD', bump: 'patch' },
  chore: { title: 'Chores', bump: 'patch' },
};

/**
 * Parse a conventional commit message
 */
function parseCommit(line) {
  // Format: hash subject
  const match = line.match(/^([a-f0-9]+)\s+(.+)$/);
  if (!match) return null;

  const [, hash, subject] = match;

  // Parse conventional commit format: type(scope): description
  const conventionalMatch = subject.match(
    /^(\w+)(?:\(([^)]+)\))?(!)?:\s*(.+)$/
  );
  if (!conventionalMatch) {
    return {
      hash,
      type: 'other',
      scope: null,
      breaking: false,
      description: subject,
    };
  }

  const [, type, scope, breaking, description] = conventionalMatch;
  return {
    hash,
    type: type.toLowerCase(),
    scope: scope || null,
    breaking:
      breaking === '!' || description.toLowerCase().includes('breaking'),
    description,
  };
}

/**
 * Get commits since last tag
 */
function getCommitsSinceLastTag() {
  const lastTag = execOutput(
    'git describe --tags --abbrev=0 2>/dev/null || echo ""'
  );
  const range = lastTag ? `${lastTag}..HEAD` : 'HEAD';

  const output = execOutput(`git log ${range} --oneline --no-merges`);
  if (!output) return [];

  return output.split('\n').filter(Boolean).map(parseCommit).filter(Boolean);
}

/**
 * Determine version bump based on commits
 */
function determineVersionBump(commits) {
  if (commits.some((c) => c.breaking)) return 'major';
  if (commits.some((c) => c.type === 'feat')) return 'minor';
  return 'patch';
}

/**
 * Calculate new version
 */
function calculateNewVersion(currentVersion, bump) {
  const [major, minor, patch] = currentVersion.split('.').map(Number);
  switch (bump) {
    case 'major':
      return `${major + 1}.0.0`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'patch':
    default:
      return `${major}.${minor}.${patch + 1}`;
  }
}

/**
 * Generate changelog markdown from commits
 */
function generateChangelog(commits, version) {
  const grouped = {};

  for (const commit of commits) {
    const typeInfo = COMMIT_TYPES[commit.type] || { title: 'Other Changes' };
    if (!grouped[typeInfo.title]) {
      grouped[typeInfo.title] = [];
    }
    grouped[typeInfo.title].push(commit);
  }

  let changelog = `## v${version}\n\n`;
  const today = new Date().toISOString().split('T')[0];
  changelog += `**Release Date:** ${today}\n\n`;

  // Breaking changes first
  const breaking = commits.filter((c) => c.breaking);
  if (breaking.length > 0) {
    changelog += `### ⚠️ Breaking Changes\n\n`;
    for (const commit of breaking) {
      changelog += `- ${commit.description}${commit.scope ? ` (${commit.scope})` : ''}\n`;
    }
    changelog += '\n';
  }

  // Then by type
  const typeOrder = [
    'Features',
    'Bug Fixes',
    'Performance Improvements',
    'Documentation',
  ];
  const sortedTypes = Object.keys(grouped).sort((a, b) => {
    const aIdx = typeOrder.indexOf(a);
    const bIdx = typeOrder.indexOf(b);
    if (aIdx === -1 && bIdx === -1) return 0;
    if (aIdx === -1) return 1;
    if (bIdx === -1) return -1;
    return aIdx - bIdx;
  });

  for (const type of sortedTypes) {
    changelog += `### ${type}\n\n`;
    for (const commit of grouped[type]) {
      const scope = commit.scope ? `**${commit.scope}:** ` : '';
      changelog += `- ${scope}${commit.description}\n`;
    }
    changelog += '\n';
  }

  return changelog;
}

/**
 * Generate UpdatesContent.tsx entry
 */
function generateUpdatesEntry(commits, version) {
  const today = new Date();
  const dateStr = today.toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Group features for display
  const features = commits
    .filter((c) => c.type === 'feat')
    .map((c) => ({
      title: c.description,
      scope: c.scope,
    }));

  const fixes = commits
    .filter((c) => c.type === 'fix')
    .map((c) => c.description);

  return {
    version,
    date: dateStr,
    features,
    fixes,
  };
}

/**
 * Update UpdatesContent.tsx with new release
 */
function updateUpdatesContent(entry) {
  const filePath = join(
    ROOT_DIR,
    'apps/landing/src/pages/legal/UpdatesContent.tsx'
  );
  let content = readFileSync(filePath, 'utf-8');

  // Find the releases array and add new entry at the start
  const versionKey = entry.version.replace(/\./g, '');
  const featuresCode =
    entry.features.length > 0
      ? `
        // Features from v${entry.version}
        {
          icon: Sparkles,
          title: updatesPage?.v${versionKey}F1Title || '${entry.features[0]?.title || 'New features'}',
          description: updatesPage?.v${versionKey}F1Desc || 'See changelog for details.',
        },`
      : '';

  const newReleaseEntry = `    {
      version: '${entry.version}',
      date: updatesPage?.v${versionKey}Date || '${entry.date}',
      title: updatesPage?.v${versionKey}Title || 'Release ${entry.version}',
      description:
        updatesPage?.v${versionKey}Description ||
        'Nieuwe verbeteringen en bugfixes.',
      features: [${featuresCode}
      ],
    },`;

  // Insert new release at the start of the releases array
  const releasesMatch = content.match(/(const releases = \[\s*)\{/);
  if (releasesMatch) {
    content = content.replace(
      releasesMatch[0],
      `${releasesMatch[1]}${newReleaseEntry}\n    {`
    );
    writeFileSync(filePath, content);
    return true;
  }

  return false;
}

/**
 * Update package.json version
 */
function updatePackageJsonVersion(newVersion) {
  const packagePath = join(ROOT_DIR, 'package.json');
  const pkg = JSON.parse(readFileSync(packagePath, 'utf-8'));
  pkg.version = newVersion;
  writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + '\n');
}

/**
 * Prompt user for confirmation
 */
async function confirm(message) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(`${message} (y/N) `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y');
    });
  });
}

/**
 * Main release flow
 */
async function main() {
  log('\n🚀 Fluxby Release Script', 'bright');
  if (isDryRun) {
    log('   (DRY RUN - no changes will be made)\n', 'yellow');
  }

  // Step 1: Check git status
  logStep('1/7', 'Checking git status...');
  const status = execOutput('git status --porcelain');
  if (status && !isDryRun) {
    log(
      'Error: Working directory is not clean. Commit or stash changes first.',
      'red'
    );
    process.exit(1);
  }

  // Step 2: Get current version and commits
  logStep('2/7', 'Analyzing commits...');
  const pkg = JSON.parse(readFileSync(join(ROOT_DIR, 'package.json'), 'utf-8'));
  const currentVersion = pkg.version;
  const commits = getCommitsSinceLastTag();

  if (commits.length === 0) {
    log('No commits since last tag.', 'yellow');
    process.exit(0);
  }

  log(`Found ${commits.length} commits since last release`, 'green');

  // Step 3: Determine new version
  logStep('3/7', 'Calculating version...');
  const bump = determineVersionBump(commits);
  const newVersion = forceVersion || calculateNewVersion(currentVersion, bump);

  log(`Current version: ${currentVersion}`, 'cyan');
  log(`Version bump: ${bump}`, 'cyan');
  log(`New version: ${newVersion}`, 'green');

  // Step 3.5: Check if version already exists in package.json, UpdatesContent.tsx, or CHANGELOG.md
  let versionExists = false;
  // Check package.json
  if (pkg.version === newVersion) {
    versionExists = true;
  }
  // Check UpdatesContent.tsx
  try {
    const updatesContent = readFileSync(
      join(ROOT_DIR, 'apps/landing/src/pages/legal/UpdatesContent.tsx'),
      'utf-8'
    );
    if (updatesContent.includes(`version: '${newVersion}'`)) {
      versionExists = true;
    }
  } catch {
    // Ignore if UpdatesContent.tsx does not exist or cannot be read
  }
  // Check CHANGELOG.md
  try {
    const changelogFile = readFileSync(join(ROOT_DIR, 'CHANGELOG.md'), 'utf-8');
    if (changelogFile.includes(`v${newVersion}`)) {
      versionExists = true;
    }
  } catch {
    // Ignore if CHANGELOG.md does not exist or cannot be read
  }

  if (versionExists) {
    log(
      `\nVersion ${newVersion} already exists in one or more files. Skipping file changes.`,
      'yellow'
    );
    return;
  }

  // Step 4: Generate changelog
  logStep('4/7', 'Generating changelog...');
  const changelog = generateChangelog(commits, newVersion);
  console.log('\n--- Changelog Preview ---');
  console.log(changelog);
  console.log('--- End Preview ---\n');

  if (isDryRun) {
    log('\n✓ Dry run completed. No changes made.', 'green');
    return;
  }

  // Confirm
  const confirmed = await confirm('\nProceed with release?');
  if (!confirmed) {
    log('Release cancelled.', 'yellow');
    process.exit(0);
  }

  // Step 5: Update files
  logStep('5/7', 'Updating files...');

  // Update package.json
  updatePackageJsonVersion(newVersion);
  log('✓ Updated package.json', 'green');

  // Update UpdatesContent.tsx
  const entry = generateUpdatesEntry(commits, newVersion);
  if (updateUpdatesContent(entry)) {
    log('✓ Updated UpdatesContent.tsx', 'green');
  }

  // Generate API assets (OpenAPI & Bruno)
  log('Generating API assets...', 'cyan');
  exec('npm run generate:api');
  log('✓ Generated API assets', 'green');

  // Write CHANGELOG.md
  const changelogPath = join(ROOT_DIR, 'CHANGELOG.md');
  let existingChangelog = '';
  if (existsSync(changelogPath)) {
    existingChangelog = readFileSync(changelogPath, 'utf-8');
    // Remove header if present
    existingChangelog = existingChangelog.replace(/^# Changelog\n+/, '');
  }
  writeFileSync(
    changelogPath,
    `# Changelog\n\n${changelog}${existingChangelog}`
  );
  log('✓ Updated CHANGELOG.md', 'green');

  // Step 6: Commit and tag
  logStep('6/7', 'Creating commit and tag...');
  exec('git add -A');
  exec(`git commit -m "chore(release): v${newVersion}"`);
  exec(`git tag -a v${newVersion} -m "Release v${newVersion}"`);
  log(`✓ Created tag v${newVersion}`, 'green');

  // Step 7: Push
  logStep('7/7', 'Pushing to remote...');
  exec('git push');
  exec('git push --tags');
  log('✓ Pushed to remote', 'green');

  log(`\n🎉 Successfully released v${newVersion}!`, 'bright');
  log('GitHub Actions will now build and publish the release.', 'cyan');
}

main().catch((error) => {
  log(`\nError: ${error.message}`, 'red');
  process.exit(1);
});
