#!/usr/bin/env node
/**
 * Release script for Fluxby
 *
 * Usage:
 *   npm run release          # Interactive release
 *   npm run release:dry      # Dry run (no actual changes)
 *
 * This script:
 * 1. Checks git status (clean working directory required)
 * 2. Parses conventional commits since last tag
 * 3. Determines version bump (major/minor/patch)
 * 4. Generates changelog
 * 5. Updates version in package.json, tauri.conf.json, and Cargo.toml
 * 6. Updates UpdatesContent.tsx with smart feature bundling and icons
 * 7. Updates translation files (nl.ts and en.ts) with new version strings
 * 8. Updates CHANGELOG.md
 * 9. Commits changes, creates git tag, and pushes
 *
 * Smart Features:
 * - Bundles commits by scope (e.g., all "ui" changes together)
 * - Selects appropriate icons based on scope/keywords
 * - Generates Dutch and English translations automatically
 * - Creates user-friendly feature descriptions
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
 * Generate a Dutch title for a commit - makes it user-friendly
 */
function generateTitleNl(commit) {
  // Try to create a more user-friendly Dutch title from the description
  const desc = commit.description;
  const transformed = transformToUserFriendlyNl(desc);
  return transformed.charAt(0).toUpperCase() + transformed.slice(1);
}

/**
 * Generate an English title for a commit - makes it user-friendly
 */
function generateTitleEn(commit) {
  const desc = commit.description;
  const transformed = transformToUserFriendlyEn(desc);
  return transformed.charAt(0).toUpperCase() + transformed.slice(1);
}

/**
 * Transform a technical commit message to a user-friendly Dutch description
 */
function transformToUserFriendlyNl(message) {
  // Dictionary of technical terms to Dutch user-friendly translations
  const technicalToUserNl = {
    // Common technical actions
    'add': 'toegevoegd',
    'implement': 'geïmplementeerd',
    'fix': 'opgelost',
    'update': 'bijgewerkt',
    'improve': 'verbeterd',
    'refactor': 'verbeterd',
    'enhance': 'verbeterd',
    'remove': 'verwijderd',
    'delete': 'verwijderd',
    'optimize': 'geoptimaliseerd',
    'support': 'ondersteuning toegevoegd voor',
    
    // Technical terms to user-friendly Dutch
    'sync': 'synchronisatie',
    'database': 'database',
    'api': 'API',
    'ui': 'interface',
    'ux': 'gebruikerservaring',
    'csv': 'CSV',
    'import': 'importeren',
    'export': 'exporteren',
    'filter': 'filter',
    'search': 'zoeken',
    'sort': 'sorteren',
    'pagination': 'bladeren',
    'validation': 'validatie',
    'authentication': 'authenticatie',
    'authorization': 'autorisatie',
    'encryption': 'versleuteling',
    'backup': 'backup',
    'restore': 'herstel',
    'settings': 'instellingen',
    'preferences': 'voorkeuren',
    'notification': 'melding',
    'alert': 'waarschuwing',
    'error': 'fout',
    'warning': 'waarschuwing',
    'success': 'succes',
    'loading': 'laden',
    'performance': 'prestaties',
    'responsive': 'responsive',
    'mobile': 'mobiel',
    'desktop': 'desktop',
    'dark mode': 'donkere modus',
    'light mode': 'lichte modus',
    'theme': 'thema',
    'layout': 'layout',
    'component': 'component',
    'widget': 'widget',
    'chart': 'grafiek',
    'graph': 'grafiek',
    'dashboard': 'dashboard',
    'analytics': 'analyse',
    'report': 'rapport',
    'transaction': 'transactie',
    'transactions': 'transacties',
    'category': 'categorie',
    'categories': 'categorieën',
    'budget': 'budget',
    'account': 'rekening',
    'accounts': 'rekeningen',
    'contact': 'contact',
    'contacts': 'contacten',
    'address book': 'adresboek',
    'profile': 'profiel',
    'user': 'gebruiker',
    'p2p': 'peer-to-peer',
    'peer': 'apparaat',
    'device': 'apparaat',
    'browser': 'browser',
    'pwa': 'web app',
    'offline': 'offline',
    'online': 'online',
  };

  let result = message.toLowerCase();
  
  // Apply translations
  for (const [tech, user] of Object.entries(technicalToUserNl)) {
    const regex = new RegExp(`\\b${tech}\\b`, 'gi');
    result = result.replace(regex, user);
  }

  // Capitalize first letter
  result = result.charAt(0).toUpperCase() + result.slice(1);

  return result;
}

/**
 * Transform a technical commit message to a user-friendly English description
 */
function transformToUserFriendlyEn(message) {
  // Just capitalize and clean up for English (already user-friendly)
  let result = message;
  
  // Remove common technical prefixes
  result = result.replace(/^(implement|add|fix|update|improve|refactor|enhance)\s+/i, '');
  
  // Capitalize first letter
  result = result.charAt(0).toUpperCase() + result.slice(1);
  
  return result;
}

/**
 * Generate a Dutch scope-based title for bundled commits - more creative
 */
function generateScopeTitleNl(scope, commits) {
  // Get a sense of what was done
  const hasFeatures = commits.some((c) => c.type === 'feat');
  
  // More creative scope titles based on what was changed
  const scopeTitlesCreativeNl = {
    ui: hasFeatures 
      ? ['Frisse nieuwe interface', 'Verbeterde gebruikerservaring', 'Interface upgrade'][Math.floor(Math.random() * 3)]
      : ['Interface verfijningen', 'Visuele verbeteringen'][Math.floor(Math.random() * 2)],
    web: hasFeatures
      ? ['Nieuwe web app mogelijkheden', 'Web app uitbreidingen'][Math.floor(Math.random() * 2)]
      : ['Web app verbeteringen', 'Betere web ervaring'][Math.floor(Math.random() * 2)],
    api: ['API verbeteringen', 'Backend updates'][Math.floor(Math.random() * 2)],
    landing: ['Landingspagina verbeteringen', 'Website updates'][Math.floor(Math.random() * 2)],
    database: hasFeatures
      ? ['Nieuwe data mogelijkheden', 'Uitgebreide data functionaliteit'][Math.floor(Math.random() * 2)]
      : ['Database optimalisaties', 'Data verbeteringen'][Math.floor(Math.random() * 2)],
    core: ['Kern verbeteringen', 'Onder de motorkap'][Math.floor(Math.random() * 2)],
    shared: 'Gedeelde functionaliteit',
    tauri: hasFeatures
      ? ['Nieuwe desktop functies', 'Desktop app uitbreidingen'][Math.floor(Math.random() * 2)]
      : ['Desktop app verbeteringen'][0],
    ci: 'Bouw & deployment verbeteringen',
    release: 'Release verbeteringen',
    security: ['Beveiligingsupdate', 'Verbeterde beveiliging'][Math.floor(Math.random() * 2)],
    screenshots: 'Screenshot verbeteringen',
    pwa: ['Progressive Web App updates', 'Installeerbare app verbeteringen'][Math.floor(Math.random() * 2)],
    mobile: ['Mobiele verbeteringen', 'Beter op je telefoon'][Math.floor(Math.random() * 2)],
  };
  
  const title = scopeTitlesCreativeNl[scope.toLowerCase()];
  return (typeof title === 'string' ? title : title) || `${scope} verbeteringen`;
}

/**
 * Generate an English scope-based title for bundled commits - more creative
 */
function generateScopeTitleEn(scope, commits) {
  const hasFeatures = commits.some((c) => c.type === 'feat');
  
  const scopeTitlesCreativeEn = {
    ui: hasFeatures 
      ? ['Fresh new interface', 'Enhanced user experience', 'Interface upgrade'][Math.floor(Math.random() * 3)]
      : ['Interface refinements', 'Visual improvements'][Math.floor(Math.random() * 2)],
    web: hasFeatures
      ? ['New web app capabilities', 'Web app extensions'][Math.floor(Math.random() * 2)]
      : ['Web app improvements', 'Better web experience'][Math.floor(Math.random() * 2)],
    api: ['API improvements', 'Backend updates'][Math.floor(Math.random() * 2)],
    landing: ['Landing page improvements', 'Website updates'][Math.floor(Math.random() * 2)],
    database: hasFeatures
      ? ['New data capabilities', 'Extended data functionality'][Math.floor(Math.random() * 2)]
      : ['Database optimizations', 'Data improvements'][Math.floor(Math.random() * 2)],
    core: ['Core improvements', 'Under the hood'][Math.floor(Math.random() * 2)],
    shared: 'Shared functionality',
    tauri: hasFeatures
      ? ['New desktop features', 'Desktop app extensions'][Math.floor(Math.random() * 2)]
      : 'Desktop app improvements',
    ci: 'Build & deployment improvements',
    release: 'Release improvements',
    security: ['Security update', 'Enhanced security'][Math.floor(Math.random() * 2)],
    screenshots: 'Screenshot improvements',
    pwa: ['Progressive Web App updates', 'Installable app improvements'][Math.floor(Math.random() * 2)],
    mobile: ['Mobile improvements', 'Better on your phone'][Math.floor(Math.random() * 2)],
  };
  
  const title = scopeTitlesCreativeEn[scope.toLowerCase()];
  return (typeof title === 'string' ? title : title) || `${scope} improvements`;
}

/**
 * Generate creative Dutch descriptions for single commits
 */
const CREATIVE_DESCRIPTIONS_NL = {
  feat: [
    'We hebben iets nieuws voor je! Bekijk de release notes voor alle details.',
    'Nieuwe functionaliteit waar je iets aan hebt.',
    'Er is weer wat bijgekomen. Ontdek het zelf!',
    'Dit maakt Fluxby nog beter.',
  ],
  fix: [
    'Een vervelend probleempje opgelost.',
    'Dit had niet moeten gebeuren, maar nu is het gefixed!',
    'Bugs gedood, app verbeterd.',
    'Kleine fix, groot verschil.',
  ],
  perf: [
    'Fluxby is nu nog sneller!',
    'Performance boost onder de motorkap.',
    'Geoptimaliseerd voor een soepelere ervaring.',
  ],
  refactor: [
    'Onder de motorkap verbeterd.',
    'Code opgeschoond, app nog betrouwbaarder.',
  ],
  default: [
    'Bekijk de release notes op GitHub voor alle details.',
    'Kleine verbetering, grote impact.',
  ],
};

/**
 * Generate creative English descriptions for single commits
 */
const CREATIVE_DESCRIPTIONS_EN = {
  feat: [
    "We've got something new for you! Check the release notes for all details.",
    'New functionality that actually helps.',
    "There's more to explore. Discover it yourself!",
    'This makes Fluxby even better.',
  ],
  fix: [
    'An annoying issue has been squashed.',
    "This shouldn't have happened, but it's fixed now!",
    'Bugs eliminated, app improved.',
    'Small fix, big difference.',
  ],
  perf: [
    'Fluxby is now even faster!',
    'Performance boost under the hood.',
    'Optimized for a smoother experience.',
  ],
  refactor: [
    'Improved under the hood.',
    'Code cleaned up, app more reliable.',
  ],
  default: [
    'Check the release notes on GitHub for all details.',
    'Small improvement, big impact.',
  ],
};

/**
 * Generate a Dutch description for a single commit - more creative
 */
function generateDescriptionNl(commit) {
  const descriptions = CREATIVE_DESCRIPTIONS_NL[commit.type] || CREATIVE_DESCRIPTIONS_NL.default;
  return descriptions[Math.floor(Math.random() * descriptions.length)];
}

/**
 * Generate an English description for a single commit - more creative
 */
function generateDescriptionEn(commit) {
  const descriptions = CREATIVE_DESCRIPTIONS_EN[commit.type] || CREATIVE_DESCRIPTIONS_EN.default;
  return descriptions[Math.floor(Math.random() * descriptions.length)];
}

/**
 * Generate a bundled Dutch description from multiple commits - more creative
 */
function generateBundledDescriptionNl(commits) {
  const features = commits.filter((c) => c.type === 'feat');
  const fixes = commits.filter((c) => c.type === 'fix');
  const other = commits.filter((c) => c.type !== 'feat' && c.type !== 'fix');
  
  // Creative bundled descriptions
  if (features.length > 3 && fixes.length > 0) {
    return `Een hele lading nieuwe functies (${features.length}!) en ${fixes.length} fixes. Check de release op GitHub!`;
  }
  if (features.length > 3) {
    return `${features.length} nieuwe mogelijkheden om te ontdekken. Bekijk de release notes!`;
  }
  if (fixes.length > 5) {
    return `We hebben flink opgeruimd: ${fixes.length} bugs de deur uit. Bekijk de release voor details.`;
  }

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
    return 'Bekijk de release op GitHub voor alle details.';
  }
  return parts.join(', ') + '. Bekijk de release op GitHub!';
}

/**
 * Generate a bundled English description from multiple commits - more creative
 */
function generateBundledDescriptionEn(commits) {
  const features = commits.filter((c) => c.type === 'feat');
  const fixes = commits.filter((c) => c.type === 'fix');
  const other = commits.filter((c) => c.type !== 'feat' && c.type !== 'fix');

  // Creative bundled descriptions
  if (features.length > 3 && fixes.length > 0) {
    return `A whole bunch of new features (${features.length}!) and ${fixes.length} fixes. Check the release on GitHub!`;
  }
  if (features.length > 3) {
    return `${features.length} new capabilities to discover. Check out the release notes!`;
  }
  if (fixes.length > 5) {
    return `We did some spring cleaning: ${fixes.length} bugs squashed. See the release for details.`;
  }

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
    return 'Check out the release on GitHub for all details.';
  }
  return parts.join(', ') + '. Check the release on GitHub!';
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

  // Get all required icons (always include ExternalLink for the release link)
  const requiredIcons = [...getRequiredIcons(entry.bundles), 'ExternalLink'];

  // Check which icons are already imported
  const importMatch = content.match(/import \{([^}]+)\} from 'lucide-react';/);
  if (importMatch) {
    const existingIcons = importMatch[1]
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0); // Filter out empty strings
    const missingIcons = requiredIcons.filter(
      (icon) => !existingIcons.includes(icon)
    );

    if (missingIcons.length > 0) {
      // Add missing icons to import, ensuring no empty strings
      const allIcons = [...new Set([...existingIcons, ...missingIcons])]
        .filter((s) => s.length > 0)
        .sort();
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
 * Update package.json version (all packages, tauri.conf.json, and Cargo.toml)
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

  // Update apps/tauri/Cargo.toml
  const cargoTomlPath = join(ROOT_DIR, 'apps/tauri/Cargo.toml');
  let cargoToml = readFileSync(cargoTomlPath, 'utf-8');
  cargoToml = cargoToml.replace(
    /^version = "[^"]*"$/m,
    `version = "${newVersion}"`
  );
  writeFileSync(cargoTomlPath, cargoToml);

  // Update packages/shared/package.json
  const sharedPackagePath = join(ROOT_DIR, 'packages/shared/package.json');
  const sharedPkg = JSON.parse(readFileSync(sharedPackagePath, 'utf-8'));
  sharedPkg.version = newVersion;
  writeFileSync(sharedPackagePath, JSON.stringify(sharedPkg, null, 2) + '\n');

  // Update packages/database/package.json
  const databasePackagePath = join(ROOT_DIR, 'packages/database/package.json');
  const databasePkg = JSON.parse(readFileSync(databasePackagePath, 'utf-8'));
  databasePkg.version = newVersion;
  writeFileSync(
    databasePackagePath,
    JSON.stringify(databasePkg, null, 2) + '\n'
  );

  // Update packages/core/package.json
  const corePackagePath = join(ROOT_DIR, 'packages/core/package.json');
  const corePkg = JSON.parse(readFileSync(corePackagePath, 'utf-8'));
  corePkg.version = newVersion;
  writeFileSync(corePackagePath, JSON.stringify(corePkg, null, 2) + '\n');

  // Update apps/api/package.json
  const apiPackagePath = join(ROOT_DIR, 'apps/api/package.json');
  const apiPkg = JSON.parse(readFileSync(apiPackagePath, 'utf-8'));
  apiPkg.version = newVersion;
  writeFileSync(apiPackagePath, JSON.stringify(apiPkg, null, 2) + '\n');

  // Update apps/web/package.json
  const webPackagePath = join(ROOT_DIR, 'apps/web/package.json');
  const webPkg = JSON.parse(readFileSync(webPackagePath, 'utf-8'));
  webPkg.version = newVersion;
  writeFileSync(webPackagePath, JSON.stringify(webPkg, null, 2) + '\n');

  // Update apps/landing/package.json
  const landingPackagePath = join(ROOT_DIR, 'apps/landing/package.json');
  const landingPkg = JSON.parse(readFileSync(landingPackagePath, 'utf-8'));
  landingPkg.version = newVersion;
  writeFileSync(landingPackagePath, JSON.stringify(landingPkg, null, 2) + '\n');

  log(
    `✓ Updated versions to ${newVersion} in all package.json files, tauri.conf.json, and Cargo.toml`,
    'green'
  );
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

  // Step 1.5: Run full build verification
  if (!isDryRun) {
    logStep('1.5/9', 'Running full build verification...');
    try {
      log('Building all packages and apps...', 'cyan');
      exec('npm run build');
      log('✓ Build verification passed', 'green');
    } catch (error) {
      log(`\n❌ Build failed: ${error.message}`, 'red');
      process.exit(1);
    }
  } else {
    logStep('1.5/9', 'Skipping build verification (dry run)');
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
