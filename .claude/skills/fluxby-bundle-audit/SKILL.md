---
name: fluxby-bundle-audit
description: Measure and shrink what the Fluxby web app or landing page loads at startup. Use when adding a dependency, importing a heavy library into a component that renders on every page, investigating slow first load, or when asked about bundle size or performance.
---

# Audit Fluxby's startup bundle

Every page of `/app` waits for the entry chunk, so anything imported from
`main.tsx`, `App.tsx`, layout, contexts or `@/lib/data-service` ships to every
user on first load. Pages are already route-split with `React.lazy` in
`apps/web/src/App.tsx` and `apps/landing/src/App.tsx`.

## Measure

```bash
node scripts/analyze-bundle.mjs web        # or: landing; optional 2nd arg = rows
```

It builds in memory (no `dist/` writes) and prints the entry chunk's raw/gzip
size plus its largest contributors (pre-minification, for ranking only).

Baseline after the October 2026 audit: **web entry ≈ 336 KB gzip** plus one
~25 KB language chunk; landing entry ≈ 190 KB gzip. Record the before/after numbers in the commit message.

To see why a module is in the entry, find its static importers:

```bash
grep -rn "from '<module>'" apps/web/src packages/*/src
```

## Already deferred — keep it that way

| Module                        | How it is deferred                                                                                                                              |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `react-day-picker` (calendar) | `lazy()` in `HeaderFilters.tsx`, preloaded on trigger hover/focus                                                                               |
| `peerjs` + WebRTC shims       | `loadPeerJs()` in `packages/core/src/peerjs-loader.ts`; type-only imports                                                                       |
| `@sentry/react`               | Dynamic import in `error-tracking.ts`, only when `VITE_SENTRY_DSN` is set                                                                       |
| `recharts`, `wa-sqlite`       | `manualChunks` in `apps/web/vite.config.ts`, loaded by pages that need them                                                                     |
| Caveat font                   | Imported by `AboutContent.tsx` only                                                                                                             |
| `src/lib/i18n/nl.ts`, `en.ts` | `loadTranslations()` in `src/lib/i18n/loader.ts`; `main.tsx` loads the stored language before render; use `getTranslations()` / `useLanguage()` |

A static `import { X } from 'peerjs'` (or from these modules) anywhere in the
startup graph silently undoes this. Use `import type` for types.

## Known remaining weight (candidates)

- `onboarding-data.ts` (~71 KB) — read synchronously by `OnboardingContext`.
- `packages/shared` `seed-data` (~44 KB) — only needed when seeding demo data.
- Landing: both translation files (~310 KB raw) are in its entry. Splitting by
  language adds a request before first paint unless the route chunk loads in
  parallel; weigh that before changing it.

## Deferring a module safely

1. Make imports in the startup graph `import type` only.
2. Load with `import()` at the point of use; cache the promise; let a failed
   load (offline) be retried.
3. If the UI waits on it, wrap in `<Suspense>` with a fallback that reserves the
   same size, and preload on hover/focus of the trigger.
4. Guard against teardown during the await (component unmounted, sync destroyed).
5. Tests that `vi.mock` the module still work with dynamic `import()`; preload it
   in `beforeEach` when a test expects synchronous construction.
6. Re-run the analysis, then verify in the production build (`fluxby-verify`)
   that the chunk loads only when expected.
