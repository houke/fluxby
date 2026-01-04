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
 * 4. Updates UpdatesContent.tsx with new release (smart bundling + icons)
 * 5. Updates translation files (nl.ts and en.ts)
 * 6. Updates package.json versions
 * 7. Commits changes
 * 8. Creates git tag
 * 9. Pushes to trigger release workflow
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
 * Icon mapping for smart icon selection based on scope/keywords
 * Maps to lucide-react icon names used in UpdatesContent.tsx
 */
const ICON_MAPPING = {
  // Scope-based icons
  scopes: {
    ui: 'Palette',
    web: 'Globe',
    api: 'BookOpen',
    landing: 'FileText',
    database: 'Database',
    core: 'Cpu',
    shared: 'Share2',
    tauri: 'Monitor',
    ci: 'GitBranch',
    release: 'Rocket',
    security: 'Shield',
    auth: 'Lock',
    budget: 'Target',
    category: 'Tag',
    categories: 'Tag',
    transaction: 'ArrowLeftRight',
    transactions: 'ArrowLeftRight',
    account: 'Building2',
    accounts: 'Building2',
    import: 'FileSpreadsheet',
    export: 'Download',
    analytics: 'BarChart3',
    dashboard: 'LayoutDashboard',
    addressbook: 'Users',
    contact: 'Users',
    profile: 'User',
    settings: 'Settings',
    pwa: 'Smartphone',
    mobile: 'Smartphone',
    docs: 'BookOpen',
    screenshots: 'Camera',
  },
  // Keyword-based icons (checked in description)
  keywords: {
    performance: 'Zap',
    speed: 'Zap',
    fast: 'Zap',
    ai: 'Brain',
    smart: 'Brain',
    dark: 'Moon',
    light: 'Sun',
    theme: 'Palette',
    style: 'Palette',
    color: 'Palette',
    chart: 'BarChart3',
    graph: 'BarChart3',
    visual: 'Eye',
    filter: 'Filter',
    search: 'Search',
    sync: 'RefreshCw',
    backup: 'HardDrive',
    restore: 'RotateCcw',
    delete: 'Trash2',
    add: 'Plus',
    create: 'Plus',
    update: 'RefreshCw',
    fix: 'Wrench',
    bug: 'Bug',
    error: 'AlertTriangle',
    improve: 'TrendingUp',
    enhance: 'TrendingUp',
    upgrade: 'ArrowUp',
    install: 'Download',
    layout: 'LayoutGrid',
    grid: 'LayoutGrid',
    card: 'CreditCard',
    kpi: 'TrendingUp',
    onboarding: 'Compass',
    avatar: 'UserCircle',
    icon: 'Image',
    image: 'Image',
    notification: 'Bell',
    alert: 'Bell',
    banner: 'Flag',
    button: 'MousePointer',
    navigation: 'Navigation',
    menu: 'Menu',
    privacy: 'Shield',
    encrypt: 'Lock',
    secure: 'Lock',
    free: 'Gift',
    hero: 'Sparkles',
  },
  // Default icon for features
  default: 'Sparkles',
  // Default icon for fixes
  defaultFix: 'Wrench',
};

/**
 * Select the best icon for a commit based on scope and description
 */
function selectIcon(commit) {
  // Check scope first
  if (commit.scope) {
    const scopeLower = commit.scope.toLowerCase();
    if (ICON_MAPPING.scopes[scopeLower]) {
      return ICON_MAPPING.scopes[scopeLower];
    }
  }

  // Check keywords in description
  const descLower = commit.description.toLowerCase();
  for (const [keyword, icon] of Object.entries(ICON_MAPPING.keywords)) {
    if (descLower.includes(keyword)) {
      return icon;
    }
  }

  // Default based on commit type
  if (commit.type === 'fix') {
    return ICON_MAPPING.defaultFix;
  }
  return ICON_MAPPING.default;
}

/**
 * Bundle similar commits together for cleaner display
 * Groups by scope and combines descriptions
 */
function bundleCommits(commits) {
  const bundles = [];
  const scopeGroups = new Map();

  for (const commit of commits) {
    const key = commit.scope || '_no_scope_';
    if (!scopeGroups.has(key)) {
      scopeGroups.set(key, []);
    }
    scopeGroups.get(key).push(commit);
  }

  for (const [scope, groupCommits] of scopeGroups) {
    if (groupCommits.length === 1) {
      // Single commit, use as-is
      const commit = groupCommits[0];
      bundles.push({
        icon: selectIcon(commit),
        titleNl: generateTitleNl(commit),
        titleEn: generateTitleEn(commit),
        descriptionNl: generateDescriptionNl(commit),
        descriptionEn: generateDescriptionEn(commit),
        scope: commit.scope,
        commits: [commit],
      });
    } else {
      // Multiple commits with same scope - bundle them
      const bundle = {
        icon: selectIcon(groupCommits[0]), // Use icon from first commit
        scope: scope === '_no_scope_' ? null : scope,
        commits: groupCommits,
      };

      // Generate bundled title and description
      if (scope === '_no_scope_') {
        bundle.titleNl = 'Diverse verbeteringen';
        bundle.titleEn = 'Various improvements';
      } else {
        bundle.titleNl = generateScopeTitleNl(scope, groupCommits);
        bundle.titleEn = generateScopeTitleEn(scope, groupCommits);
      }
      bundle.descriptionNl = generateBundledDescriptionNl(groupCommits);
      bundle.descriptionEn = generateBundledDescriptionEn(groupCommits);
      bundles.push(bundle);
    }
  }

  return bundles;
}

/**
 * Generate a Dutch title for a commit
 */
function generateTitleNl(commit) {
  // Capitalize first letter
  const desc = commit.description;
  return desc.charAt(0).toUpperCase() + desc.slice(1);
}

/**
 * Generate an English title for a commit
 */
function generateTitleEn(commit) {
  const desc = commit.description;
  return desc.charAt(0).toUpperCase() + desc.slice(1);
}

/**
 * Generate a Dutch scope-based title for bundled commits
 */
function generateScopeTitleNl(scope) {
  const scopeNames = {
    ui: 'UI verbeteringen',
    web: 'Web app verbeteringen',
    api: 'API verbeteringen',
    landing: 'Landingspagina verbeteringen',
    database: 'Database verbeteringen',
    core: 'Core verbeteringen',
    shared: 'Gedeelde functionaliteit',
    tauri: 'Desktop app verbeteringen',
    ci: 'CI/CD verbeteringen',
    release: 'Release verbeteringen',
    security: 'Beveiligingsverbeteringen',
    screenshots: 'Screenshot verbeteringen',
    pwa: 'PWA verbeteringen',
    mobile: 'Mobiele verbeteringen',
  };
  return scopeNames[scope.toLowerCase()] || `${scope} verbeteringen`;
}

/**
 * Generate an English scope-based title for bundled commits
 */
function generateScopeTitleEn(scope) {
  const scopeNames = {
    ui: 'UI improvements',
    web: 'Web app improvements',
    api: 'API improvements',
    landing: 'Landing page improvements',
    database: 'Database improvements',
    core: 'Core improvements',
    shared: 'Shared functionality',
    tauri: 'Desktop app improvements',
    ci: 'CI/CD improvements',
    release: 'Release improvements',
    security: 'Security improvements',
    screenshots: 'Screenshot improvements',
    pwa: 'PWA improvements',
    mobile: 'Mobile improvements',
  };
  return scopeNames[scope.toLowerCase()] || `${scope} improvements`;
}

/**
 * Generate a Dutch description for a single commit
 */
function generateDescriptionNl(commit) {
  // For single commits, use the description as-is or a generic message
  if (commit.type === 'feat') {
    return `Nieuwe functionaliteit toegevoegd.`;
  } else if (commit.type === 'fix') {
    return `Bug opgelost.`;
  }
  return `Zie changelog voor details.`;
}

/**
 * Generate an English description for a single commit
 */
function generateDescriptionEn(commit) {
  if (commit.type === 'feat') {
    return `New functionality added.`;
  } else if (commit.type === 'fix') {
    return `Bug fixed.`;
  }
  return `See changelog for details.`;
}

/**
 * Generate a bundled Dutch description from multiple commits
 */
function generateBundledDescriptionNl(commits) {
  const features = commits.filter((c) => c.type === 'feat');
  const fixes = commits.filter((c) => c.type === 'fix');
  const other = commits.filter((c) => c.type !== 'feat' && c.type !== 'fix');

  const parts = [];
  if (features.length > 0) {
    parts.push(
      `${features.length} nieuwe ${features.length === 1 ? 'feature' : 'features'}`
    );
  }
  if (fixes.length > 0) {
    parts.push(`${fixes.length} ${fixes.length === 1 ? 'bugfix' : 'bugfixes'}`);
  }
  if (other.length > 0) {
    parts.push(
      `${other.length} ${other.length === 1 ? 'verbetering' : 'verbeteringen'}`
    );
  }

  if (parts.length === 0) {
    return 'Zie changelog voor details.';
  }
  return parts.join(', ') + '. Zie changelog voor details.';
}

/**
 * Generate a bundled English description from multiple commits
 */
function generateBundledDescriptionEn(commits) {
  const features = commits.filter((c) => c.type === 'feat');
  const fixes = commits.filter((c) => c.type === 'fix');
  const other = commits.filter((c) => c.type !== 'feat' && c.type !== 'fix');

  const parts = [];
  if (features.length > 0) {
    parts.push(
      `${features.length} new ${features.length === 1 ? 'feature' : 'features'}`
    );
  }
  if (fixes.length > 0) {
    parts.push(`${fixes.length} bug ${fixes.length === 1 ? 'fix' : 'fixes'}`);
  }
  if (other.length > 0) {
    parts.push(
      `${other.length} ${other.length === 1 ? 'improvement' : 'improvements'}`
    );
  }

  if (parts.length === 0) {
    return 'See changelog for details.';
  }
  return parts.join(', ') + '. See changelog for details.';
}

/**
 * Get all unique icons used by the bundles
 */
function getRequiredIcons(bundles) {
  const icons = new Set(['Sparkles', 'Zap']); // Always include these defaults
  for (const bundle of bundles) {
    icons.add(bundle.icon);
  }
  return Array.from(icons).sort();
}

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
 * Generate UpdatesContent.tsx entry with smart bundling
 */
function generateUpdatesEntry(commits, version) {
  const today = new Date();
  const dateStrNl = today.toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const dateStrEn = today.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  // Separate features and fixes
  const features = commits.filter((c) => c.type === 'feat');
  const fixes = commits.filter((c) => c.type === 'fix');
  const other = commits.filter((c) => c.type !== 'feat' && c.type !== 'fix');

  // Bundle features smartly
  const featureBundles = bundleCommits(features);

  // Bundle fixes smartly (if there are multiple, combine them)
  let fixBundles = [];
  if (fixes.length > 0) {
    if (fixes.length <= 3) {
      // Few fixes - show individually
      fixBundles = bundleCommits(fixes);
    } else {
      // Many fixes - combine into one summary
      fixBundles = [
        {
          icon: 'Wrench',
          titleNl: 'Bugfixes',
          titleEn: 'Bug fixes',
          descriptionNl: `${fixes.length} bugs opgelost. Zie changelog voor details.`,
          descriptionEn: `${fixes.length} bugs fixed. See changelog for details.`,
          scope: null,
          commits: fixes,
        },
      ];
    }
  }

  // Combine all bundles
  const allBundles = [...featureBundles, ...fixBundles];

  return {
    version,
    dateNl: dateStrNl,
    dateEn: dateStrEn,
    bundles: allBundles,
    totalFeatures: features.length,
    totalFixes: fixes.length,
    totalOther: other.length,
  };
}

/**
 * Update UpdatesContent.tsx with new release using smart bundling and icons
 */
function updateUpdatesContent(entry) {
  const filePath = join(
    ROOT_DIR,
    'apps/landing/src/pages/legal/UpdatesContent.tsx'
  );
  let content = readFileSync(filePath, 'utf-8');

  const versionKey = entry.version.replace(/\./g, '');

  // Get all required icons
  const requiredIcons = getRequiredIcons(entry.bundles);

  // Check which icons are already imported
  const importMatch = content.match(/import \{([^}]+)\} from 'lucide-react';/);
  if (importMatch) {
    const existingIcons = importMatch[1].split(',').map((s) => s.trim());
    const missingIcons = requiredIcons.filter(
      (icon) => !existingIcons.includes(icon)
    );

    if (missingIcons.length > 0) {
      // Add missing icons to import
      const allIcons = [...existingIcons, ...missingIcons].sort();
      const newImport = `import {\n  ${allIcons.join(',\n  ')},\n} from 'lucide-react';`;
      content = content.replace(
        /import \{[^}]+\} from 'lucide-react';/,
        newImport
      );
    }
  }

  // Generate features code for each bundle
  const featuresCode = entry.bundles
    .map((bundle, index) => {
      const featureNum = index + 1;
      return `        {
          icon: ${bundle.icon},
          title: updatesPage?.v${versionKey}F${featureNum}Title || '${escapeString(bundle.titleNl)}',
          description: updatesPage?.v${versionKey}F${featureNum}Desc || '${escapeString(bundle.descriptionNl)}',
        },`;
    })
    .join('\n');

  // Generate the description based on what changed
  let descriptionNl = 'Nieuwe verbeteringen en bugfixes.';
  let descriptionEn = 'New improvements and bug fixes.';

  if (entry.totalFeatures > 0 && entry.totalFixes > 0) {
    descriptionNl = `${entry.totalFeatures} nieuwe ${entry.totalFeatures === 1 ? 'feature' : 'features'} en ${entry.totalFixes} ${entry.totalFixes === 1 ? 'bugfix' : 'bugfixes'}.`;
    descriptionEn = `${entry.totalFeatures} new ${entry.totalFeatures === 1 ? 'feature' : 'features'} and ${entry.totalFixes} bug ${entry.totalFixes === 1 ? 'fix' : 'fixes'}.`;
  } else if (entry.totalFeatures > 0) {
    descriptionNl = `${entry.totalFeatures} nieuwe ${entry.totalFeatures === 1 ? 'feature' : 'features'}.`;
    descriptionEn = `${entry.totalFeatures} new ${entry.totalFeatures === 1 ? 'feature' : 'features'}.`;
  } else if (entry.totalFixes > 0) {
    descriptionNl = `${entry.totalFixes} ${entry.totalFixes === 1 ? 'bugfix' : 'bugfixes'}.`;
    descriptionEn = `${entry.totalFixes} bug ${entry.totalFixes === 1 ? 'fix' : 'fixes'}.`;
  }

  const newReleaseEntry = `    {
      version: '${entry.version}',
      date: updatesPage?.v${versionKey}Date || '${entry.dateNl}',
      title: updatesPage?.v${versionKey}Title || 'Release ${entry.version}',
      description:
        updatesPage?.v${versionKey}Description ||
        '${escapeString(descriptionNl)}',
      features: [
${featuresCode}
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
    return { success: true, descriptionNl, descriptionEn };
  }

  return { success: false };
}

/**
 * Escape single quotes in strings for JavaScript
 */
function escapeString(str) {
  return str.replace(/'/g, "\\'");
}

/**
 * Update translation files with new version entries
 */
function updateTranslations(entry, descriptionNl, descriptionEn) {
  const versionKey = entry.version.replace(/\./g, '');

  // Generate translation entries for both languages
  const nlTranslations = generateTranslationEntriesNl(
    entry,
    versionKey,
    descriptionNl
  );
  const enTranslations = generateTranslationEntriesEn(
    entry,
    versionKey,
    descriptionEn
  );

  // Update nl.ts
  const nlPath = join(ROOT_DIR, 'apps/landing/src/lib/i18n/nl.ts');
  let nlContent = readFileSync(nlPath, 'utf-8');

  // Find the updatesPage section and add new entries after 'intro'
  const nlUpdatesMatch = nlContent.match(
    /(updatesPage:\s*\{[\s\S]*?intro:[^,]+,)/
  );
  if (nlUpdatesMatch) {
    nlContent = nlContent.replace(
      nlUpdatesMatch[0],
      nlUpdatesMatch[0] + '\n' + nlTranslations
    );
    writeFileSync(nlPath, nlContent);
    log('✓ Updated nl.ts translations', 'green');
  }

  // Update en.ts
  const enPath = join(ROOT_DIR, 'apps/landing/src/lib/i18n/en.ts');
  let enContent = readFileSync(enPath, 'utf-8');

  const enUpdatesMatch = enContent.match(
    /(updatesPage:\s*\{[\s\S]*?intro:[^,]+,)/
  );
  if (enUpdatesMatch) {
    enContent = enContent.replace(
      enUpdatesMatch[0],
      enUpdatesMatch[0] + '\n' + enTranslations
    );
    writeFileSync(enPath, enContent);
    log('✓ Updated en.ts translations', 'green');
  }
}

/**
 * Generate Dutch translation entries for a version
 */
function generateTranslationEntriesNl(entry, versionKey, descriptionNl) {
  const lines = [
    `      v${versionKey}Date: '${entry.dateNl}',`,
    `      v${versionKey}Title: 'Release ${entry.version}',`,
    `      v${versionKey}Description: '${escapeString(descriptionNl)}',`,
  ];

  entry.bundles.forEach((bundle, index) => {
    const featureNum = index + 1;
    lines.push(
      `      v${versionKey}F${featureNum}Title: '${escapeString(bundle.titleNl)}',`
    );
    lines.push(
      `      v${versionKey}F${featureNum}Desc: '${escapeString(bundle.descriptionNl)}',`
    );
  });

  return lines.join('\n');
}

/**
 * Generate English translation entries for a version
 */
function generateTranslationEntriesEn(entry, versionKey, descriptionEn) {
  const lines = [
    `      v${versionKey}Date: '${entry.dateEn}',`,
    `      v${versionKey}Title: 'Release ${entry.version}',`,
    `      v${versionKey}Description: '${escapeString(descriptionEn)}',`,
  ];

  entry.bundles.forEach((bundle, index) => {
    const featureNum = index + 1;
    lines.push(
      `      v${versionKey}F${featureNum}Title: '${escapeString(bundle.titleEn)}',`
    );
    lines.push(
      `      v${versionKey}F${featureNum}Desc: '${escapeString(bundle.descriptionEn)}',`
    );
  });

  return lines.join('\n');
}

/**
 * Update package.json version (root, tauri app, and tauri.conf.json)
 */
function updatePackageJsonVersion(newVersion) {
  // Update root package.json
  const packagePath = join(ROOT_DIR, 'package.json');
  const pkg = JSON.parse(readFileSync(packagePath, 'utf-8'));
  pkg.version = newVersion;
  writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + '\n');

  // Update apps/tauri/package.json
  const tauriPackagePath = join(ROOT_DIR, 'apps/tauri/package.json');
  const tauriPkg = JSON.parse(readFileSync(tauriPackagePath, 'utf-8'));
  tauriPkg.version = newVersion;
  writeFileSync(tauriPackagePath, JSON.stringify(tauriPkg, null, 2) + '\n');

  // Update apps/tauri/tauri.conf.json
  const tauriConfPath = join(ROOT_DIR, 'apps/tauri/tauri.conf.json');
  const tauriConf = JSON.parse(readFileSync(tauriConfPath, 'utf-8'));
  tauriConf.version = newVersion;
  writeFileSync(tauriConfPath, JSON.stringify(tauriConf, null, 2) + '\n');

  log(`✓ Updated versions to ${newVersion} in package.json, apps/tauri/package.json, and tauri.conf.json`, 'green');
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
  logStep('1/9', 'Checking git status...');
  const status = execOutput('git status --porcelain');
  if (status && !isDryRun) {
    log(
      'Error: Working directory is not clean. Commit or stash changes first.',
      'red'
    );
    process.exit(1);
  }

  // Step 2: Get current version and commits
  logStep('2/9', 'Analyzing commits...');
  const pkg = JSON.parse(readFileSync(join(ROOT_DIR, 'package.json'), 'utf-8'));
  const currentVersion = pkg.version;
  const commits = getCommitsSinceLastTag();

  if (commits.length === 0) {
    log('No commits since last tag.', 'yellow');
    process.exit(0);
  }

  log(`Found ${commits.length} commits since last release`, 'green');

  // Step 3: Determine new version
  logStep('3/9', 'Calculating version...');
  const bump = determineVersionBump(commits);
  const newVersion = forceVersion || calculateNewVersion(currentVersion, bump);

  log(`Current version: ${currentVersion}`, 'cyan');
  log(`Version bump: ${bump}`, 'cyan');
  log(`New version: ${newVersion}`, 'green');

  // Step 3.5: Check if version already exists in each file
  let packageJsonHasVersion = pkg.version === newVersion;
  let updatesContentHasVersion = false;
  let translationsHaveVersion = false;
  try {
    const updatesContent = readFileSync(
      join(ROOT_DIR, 'apps/landing/src/pages/legal/UpdatesContent.tsx'),
      'utf-8'
    );
    updatesContentHasVersion = updatesContent.includes(
      `version: '${newVersion}'`
    );
  } catch {
    // Ignore if UpdatesContent.tsx does not exist or cannot be read
  }
  try {
    const nlContent = readFileSync(
      join(ROOT_DIR, 'apps/landing/src/lib/i18n/nl.ts'),
      'utf-8'
    );
    const versionKey = newVersion.replace(/\./g, '');
    translationsHaveVersion = nlContent.includes(`v${versionKey}Date:`);
  } catch {
    // Ignore if nl.ts does not exist or cannot be read
  }
  let changelogHasVersion = false;
  try {
    const changelogFile = readFileSync(join(ROOT_DIR, 'CHANGELOG.md'), 'utf-8');
    changelogHasVersion = changelogFile.includes(`v${newVersion}`);
  } catch {
    // Ignore if CHANGELOG.md does not exist or cannot be read
  }

  if (
    packageJsonHasVersion &&
    updatesContentHasVersion &&
    changelogHasVersion &&
    translationsHaveVersion
  ) {
    log(
      `\nVersion ${newVersion} already exists in all files. Skipping all file changes.`,
      'yellow'
    );
    return;
  }

  // Step 4: Generate changelog
  logStep('4/9', 'Generating changelog...');
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
  logStep('5/9', 'Updating files...');

  // Update package.json
  if (!packageJsonHasVersion) {
    updatePackageJsonVersion(newVersion);
    log('✓ Updated package.json', 'green');
  } else {
    log('⏭️ Skipped package.json (version already exists)', 'yellow');
  }

  // Update UpdatesContent.tsx and translations
  const entry = generateUpdatesEntry(commits, newVersion);
  if (!updatesContentHasVersion) {
    const result = updateUpdatesContent(entry);
    if (result.success) {
      log('✓ Updated UpdatesContent.tsx', 'green');
      log(
        `  → Added ${entry.bundles.length} feature cards with smart icons`,
        'cyan'
      );

      // Update translation files
      logStep('6/9', 'Updating translations...');
      updateTranslations(entry, result.descriptionNl, result.descriptionEn);
    } else {
      log('⚠️ Failed to update UpdatesContent.tsx', 'yellow');
    }
  } else {
    log('⏭️ Skipped UpdatesContent.tsx (version already exists)', 'yellow');
  }

  // Generate API assets (OpenAPI & Bruno)
  logStep('7/9', 'Generating API assets...');
  exec('npm run generate:api');
  log('✓ Generated API assets', 'green');

  // Write CHANGELOG.md
  if (!changelogHasVersion) {
    logStep('8/9', 'Writing CHANGELOG.md...');
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
  } else {
    log('⏭️ Skipped CHANGELOG.md (version already exists)', 'yellow');
  }

  // Step 9: Commit and tag
  logStep('9/9', 'Creating commit, tag, and pushing...');
  exec('git add -A');
  exec(`git commit -m "chore(release): v${newVersion}"`);
  exec(`git tag -a v${newVersion} -m "Release v${newVersion}"`);
  log(`✓ Created tag v${newVersion}`, 'green');

  // Push
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
