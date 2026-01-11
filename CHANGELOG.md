# Changelog

## v1.4.0

**Release Date:** 2026-01-11

### Features

- **web:** disable bouncy scroll on macOS Tauri app
- **tauri,web:** add menu items and improve P2P sync reliability
- **web:** highlight header search and theme toggle in onboarding
- **web:** add subscription price change alerts and improve UX
- **web:** show empty state when filters have matches outside selected period
- **web:** polish category and addressbook actions + translations
- **web:** refine Address Book and Categories action icons
- **web:** add mobile-optimized navigation and transaction cards
- **web:** extend update checker to web users with service worker updates
- **tauri:** add in-app update mechanism via GitHub releases
- **database:** improve migration system and create comprehensive skills
- **shared:** add recurring transaction seeding and demo data
- **web:** add expandable transaction view to address book contacts
- **database:** add migration to seed demo recurring patterns
- **database:** add demo data seeding for recurring patterns
- **web:** improve subscriptions UX and dashboard date range support
- **subscriptions:** improve subscription management UX
- **web:** add shortcuts white on hover and new quick actions
- **subscriptions:** add dashboard and analytics recurring cards
- **i18n:** make spotlight search keywords translatable
- **web:** add subscriptions to search modal and fix hover sticking
- **database:** add stale code detection for cached JS bundles
- **web:** auto-execute migrations with progress UI instead of manual refresh
- **web,database:** add automatic migration prompt for version updates
- **web:** add theme toggle button to header and fix shortcut
- **web:** fix spotlight hover colors and add theme toggle shortcut
- **web:** add subscriptions & recurring pattern detection
- **web:** improve Spotlight search UX
- **web:** add global search (Spotlight) with Cmd+K shortcut

### Bug Fixes

- **web:** add top divider below native title bar in Tauri builds
- **web:** fix subscriptions not showing due to amount sign filtering
- **web:** improve empty states and fix subscriptions filter bug
- **web:** make list/calendar view toggle purple when active
- **landing:** remove iCloud from subscriptions animation and correct totals
- **web,landing:** fix subscriptions page issues and docs sidebar
- **web:** make selected subscriptions view toggle purple
- **web:** fix avgAmount storage and add empty states for subscriptions
- **web:** handle null avgAmount in subscription filters
- **web:** dashboard query, analytics recurring, and categories layout
- **web:** address multiple UI and sync issues
- **web:** filter recurring price history by date range and compute change from recent history
- **web:** remove negative sign from 'Expected this period' in Subscriptions widget
- **web:** chevron only changes on its button hover
- **web:** chevron icon turns white only when button hovered
- **web:** make addressbook chevron hover only on icon
- **web:** correct transaction type filter icons (income up, expense down)
- **web:** show correct arrows for income/expense in Address Book
- **web:** reduce bottom margin for Connection settings label in Device sync card
- **api:** make demo recurring patterns use latest transaction when available
- **web:** use COALESCE for merchant matching in pattern transactions
- **database:** add column verification to migration system
- **web:** use Plus icon for add category and add contact actions
- **ui:** restore proper hover effects in search modal
- **web:** fix proposed contacts not being removed after adding to address book
- **web:** resolve migration prompt causing app hang on load
- **api,tests:** resolve variable naming conflict and update onboarding tests
- **db:** add migration for recurring_patterns table
- **web:** use text-gray-500 instead of text-muted-foreground for Spotlight subtitles
- **web:** update search tooltip to match privacy tooltip format
- **web:** force light purple hover using !important
- **web:** use lighter purple for Spotlight subtitle hover

### Performance Improvements

- **web:** move CSV parsing to Web Worker for large file imports

### Chores

- **repo:** stage and commit all current files
- empty commit to verify GPG key

### Styles

- **web:** swap clear/"view all data" button order in transactions empty state
- **web:** reduce size of budget action buttons to small squircles
- fix lint warnings for unused variables and imports

### Tests

- **api:** ensure seeded recurring patterns use latest transaction amount
- add migration 006 to test migration prompt system

## v1.3.1

**Release Date:** 2026-01-09

### Bug Fixes

- **release:** run `npm run build` before running release script
- **release:** remove automatic `useLanguage` insertion from release script
- **landing:** restore `useLanguage` import and add `BarChart3` icon

## v1.3.0

**Release Date:** 2026-01-08

### Features

- **web:** i18n for QR validity and pairing placeholder
- **web:** enhance Privacy Mode with chart axis blurring and onboarding step
- **web:** implementation of Privacy Mode for sensitive data protection
- **web:** improve device sync UI layout
- **database:** implement file-based migration system and centralized logger
- **web:** hide "Jump to" button when already viewing suggested period
- **landing:** add device sync screenshot section with animation
- **sync:** finalize P2P sync implementation with documentation
- **web:** enable ASN Bank in import UI
- **web:** add ASN Bank CSV import support

### Bug Fixes

- **web:** enable editing of payment provider patterns
- **web:** reduce spacing between Data Management cards
- **web:** QR pairing modal & data management cards
- **web:** improve sync button tooltips and toggle hover effect
- **web:** improve settings UI interaction and spacing
- **web:** improve UX across import, transactions, and dashboard
- **landing:** add overflow constraints to DocsLayout for mobile code blocks
- **landing:** properly constrain docs page overflow on mobile
- **landing:** wrap all CodeBlocks with not-prose for proper overflow
- **landing:** ensure code blocks maintain horizontal scroll in prose
- **landing:** increase prose font size on mobile for docs pages
- **web,landing:** resolve onboarding routing loop and mobile menu issues
- **ci:** add typecheck script and ignore transpiled vite configs
- **release:** properly handle multi-line lucide-react imports
- **release:** improve release messages and fix GitHub Pages deployment

### Tests

- **api:** add integration test ensuring payment processor patterns can be updated

### Chores

- **ci:** remove GitHub Pages configuration comments from workflow
- **workspace:** commit current modified files
- update dependencies to latest versions

### Code Refactoring

- **shared:** centralize types and ensure type safety in web app

### Other Changes

- **features:** add peer-to-peer & multiple profiles; update bank CSV copy to 'multiple banks' (en/nl)
- **translation:** add peer-to-peer and multi-profile features; update bank CSV copy to multiple banks

### Styles

- **web:** unify dashboard empty state button styling with middot separator

## v1.2.0

**Release Date:** 2026-01-06

### Features

- migrate to Tailwind CSS v4 with Oxide engine
- **landing:** add TypeScript declaration for **APP_VERSION**
- **landing:** add version badge next to Fluxby in footer
- sync all package.json versions with release tag
- display app version in settings
- update release script to sync Cargo.toml version
- **database:** add sync database adapter for P2P synchronization

### Bug Fixes

- **web:** add TypeScript types to Vite config middleware
- **database:** fix TypeScript error - use undefined instead of null
- **tauri:** fix dev server URL and port configuration
- **tauri:** fix routing and 404 page for Tauri environment
- **database:** auto-recover from corrupted IndexedDB in Tauri
- **tauri:** add debug logging and error boundary for blank screen issue
- **web:** prevent redirect loop after initial setup by removing duplicate navigation
- **tauri:** use localStorage fallback for settings in Tauri
- **landing:** enable WebSocket proxy for Vite HMR and fix lint warnings
- **landing:** fix sidebar height, notice styling, and missing EN translations
- **database:** use IndexedDB VFS for Tauri instead of OPFS
- **web:** add Tauri database reset support
- **tauri:** add FS permissions via capabilities for Tauri 2
- **tauri:** fix blank screen issue with relative base path
- update Tauri version to 1.1.0

### Documentation

- add LLM contribution guidelines

### Styles

- format JSON files with multi-line arrays
- **landing:** fix global section padding to align with header
- **landing:** fix layout alignment and header overlap

### Chores

- **deps:** upgrade major dependencies
- **dx:** enable zero-build dev mode for fresh clones
- update all package.json versions to 1.1.0
- update Tauri configuration and documentation
- **release:** add build verification step and fix build errors

### Other Changes

- Fix Tauri 2 config: update plugins.fs and remove invalid plugin configs
- Revert signingIdentity to null - requires user certificate

## v1.1.0

**Release Date:** 2026-01-05

### Features

- **settings:** remove Install Fluxby card from app settings
- **web:** improve mobile transaction UI
- **landing:** fix developer docs responsiveness and table overflow
- **landing:** localize developer documentation and fix mobile responsiveness
- **landing:** translate Downloads section
- **web:** replace all localStorage usage with OPFS for persistent storage
- **web:** restrict PWA manifest to /app and set /dashboard as root

### Bug Fixes

- **web:** add consistent horizontal spacing to mobile cards
- **web,landing:** improve mobile UI styling across multiple pages
- **landing:** add missing OpenAPI documentation translations
- **landing:** constrain developer docs width to match help center
- **ui:** reposition KPI card icons to right side on desktop
- **docs:** remove overflow-x-hidden and max-width constraints
- **i18n:** remove M1/M2/M3 specification from Apple Silicon label
- **i18n:** correct Dutch downloads note translation
- **landing:** prevent horizontal overflow in developer docs on mobile
- **landing:** use shared CTA translations for Features download section

### Styles

- **web:** improve mobile layout for transaction filters and rows
- **web:** fix double borders between account cards and KPI cards on mobile
- **web:** fix responsive KPI card icon positioning

### Chores

- **ci:** ensure GitHub release is marked as latest

## v1.0.4

**Release Date:** 2026-01-04

### Chores

- **ci:** fix set-output deprecation and mark release as latest

## v1.0.3

**Release Date:** 2026-01-04

### Bug Fixes

- **release:** sync versions to tauri files and fix duplicate releases

## v1.0.2

**Release Date:** 2026-01-04

### Bug Fixes

- **landing:** use dynamic version for download links
- **ci:** consolidate GitHub release into single release with all assets
- **landing:** align download buttons at bottom of cards
- **landing:** unify macOS download card with dual download buttons
- **landing:** correct download links and split macOS options

## v1.0.1

**Release Date:** 2026-01-04

### Features

- **release:** implement per-file version checking
- **ui:** enhance KPI cards with consistent mobile layout and styling
- **ui:** make KPI cards 2x2 grid on mobile and smaller icons
- **ui:** align account setup and unlock pages top on mobile
- **ui:** improve payment processor settings and hero messaging
- **web:** improve PWA install UI and guidance
- **screenshots:** add OSX-style browser frame and batch processing script
- improve WebGL avatar, onboarding persistence, mobile UX, and security docs
- **landing:** update about page content to mention AI reformatting
- **web:** improve profile avatar selection and OPFS backup/restore

### Bug Fixes

- **ci:** reset tag
- **ci:** correct Tauri build artifact names and upload method
- **ci:** pass changelog via artifact instead of job output
- **ci:** reset tag
- **ci:** fix empty changelog in GitHub releases
- **web:** complete mobile edge-to-edge cards across all pages
- **web:** show install button only when native prompt available; keep manual instructions list
- **web:** mobile edge-to-edge cards with smaller fonts
- **web:** ensure PWA banner shows when install is available
- **web:** fix onboarding refresh and React navigation warnings
- resolve all linter errors and most warnings
- **ci:** remove VITE_BASE_URL for custom domain fluxby.app
- rewrite incorrect urls
- **deploy:** prevent README flash during GitHub Pages deployment
- **shared:** use GPU-based performance detection instead of CPU/memory
- **shared:** ensure avatar animation continuity and high-end detection on GitHub Pages
- **shared:** resolve avatar quality and animation glitches on GitHub Pages
- **shared:** improve avatar quality and animation stability on GitHub Pages
- **web:** improve import handling and onboarding - Add shared IBAN detection during CSV import - IBANs with multiple different names are moved to shared_ibans table - Users can resolve shared IBANs via Address Book UI - Fix onboarding page matching when avatar clicked - Strip /app and /dashboard base paths before matching routes - Fix ING import payment method mapping - Map overschrijving to lowercase to match transaction badge filter - Add comprehensive method map for all ING payment types - Fix UNIQUE constraint error for payment_provider_rules - Use INSERT OR IGNORE when seeding default payment providers
- **release:** wrong script run
- **release:** make sure api files are updated on release
- **landing:** add mobile optimisations
- **landing:** make all links work
- **deployment:** use correct urls for links
- **landing:** change PWA manifest name from 'Fluxby Docs' to 'Fluxby'

### Documentation

- update README usage section with categories and address book chapters
- add GitLens extension recommendation and track .vscode

### Chores

- **release:** v1.0.0
- **release:** v1.0.0
- **docs:** update agent commit message attribution format
- **docs:** update agent commit message instructions
- **release:** add version existence check and reset version

### Other Changes

- Update CNAME
- Update CNAME
- Create CNAME
- nightly run on loads of tasks
- add changes
- more iban fixes not there yet
- fix app icons for tauri builds
- fix db structure
- initial commit

### CI/CD

- **workflows:** rename tauri workflow files to fluxby naming - tauri-release.yml → fluxby-release.yml - tauri-check.yml → fluxby-pr-check.yml - Improves clarity and matches workflow names

### Build System

- **deps:** bump esbuild in the npm_and_yarn group across 1 directory
