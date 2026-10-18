---
name: fluxby-verify
description: Verify a Fluxby change end to end — lint, typecheck, unit tests, then the production GitHub Pages build (landing + /app) checked in a browser for CSP violations, third-party requests, fonts and the changed screen. Use before committing UI, security-header, service-worker, build or dependency changes, or when asked to run, launch or screenshot the built app.
---

# Verify a Fluxby change

AGENTS.md requires lint, typecheck and tests before every commit. This skill adds
the production-build browser check that catches what unit tests cannot: CSP
violations, missing lazy chunks, fonts and real rendering.

## 1. Static checks (always)

```bash
npm run lint && npm run typecheck && npm run test:run
```

- `typecheck` rebuilds `packages/*` first; a TS error in `packages/core` shows up
  as a failed `@fluxby/core` build.
- If API tests fail with `NODE_MODULE_VERSION` mismatch, the native SQLite module
  was built for another Node version. Fix locally with `npm rebuild better-sqlite3`
  (does not change package files).

## 2. Production build

```bash
npm run build:pages          # assembles landing + /app into dist/ (gitignored)
```

Serve it on a free port in the background (5177/5178 are the dev ports):

```bash
PORT=5199 node scripts/serve-pages.mjs
```

Stop it afterwards with `lsof -ti:5199 | xargs kill -15`.

## 3. Browser checks

Open `http://localhost:5199/` (landing) and `http://localhost:5199/app/` (app) in
the built-in browser. Prefer `javascript_tool` / `get_page_text` over screenshots.

Run on each page after it settles:

```js
await document.fonts.ready;
({
  lang: document.documentElement.lang,
  thirdParty: performance
    .getEntriesByType('resource')
    .map((e) => e.name)
    .filter((n) => !n.startsWith(location.origin)),
});
```

Expect:

- `thirdParty` empty on landing and on the app before any opt-in feature
  (AI/TypeSafe, sync) is used. Fluxby is local-first: no CDNs, no Google Fonts.
- `lang` equal to the selected UI language (`nl` / `en`).
- No `Content-Security-Policy` errors in `read_console_messages`.

Known noise, not regressions:

- `GET /about` (or any deep link) → 404, then a redirect: the GitHub Pages SPA
  fallback via `404.html`, reproduced by the local server.
- "An unknown error occurred when fetching the script" — the built-in browser
  pane refuses service-worker registration even for unchanged workers. Service
  worker behaviour is covered by `tests/shared/service-worker-cache.test.ts`.

### Getting into the app

First run shows language → name → master password setup. Use a throwaway local
test password (never a real one; don't repeat it in chat), then press **Skip** on
the onboarding tour. Demo data is seeded automatically. The OPFS data lives only
in the pane's profile for `localhost:5199`.

## 4. Things worth checking for specific changes

| Change                   | Check                                                                      |
| ------------------------ | -------------------------------------------------------------------------- |
| Translations / i18n      | Switch language in setup or Settings; verify both NL and EN render         |
| CSP / `index.html`       | Console free of CSP errors; `tests/web/csp-hashes.test.ts` passes          |
| Inline script in landing | Recompute its SHA-256 in the landing CSP (the test tells you the hash)     |
| Lazy-loaded component    | Network list shows its chunk loading only when the UI opens                |
| Startup bundle size      | Use the `fluxby-bundle-audit` skill                                        |
| Sync / PeerJS            | PeerJS chunk and signalling requests appear only after unlock with sync on |

## 5. Report

State what was verified in the browser and what was not (for example physical
multi-device sync, Tauri desktop packaging, service-worker install), and include
any console errors verbatim.
