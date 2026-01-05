# Changelog

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
