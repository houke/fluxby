/* global URL */

/**
 * Error reports go to the Sentry ingest host named in VITE_SENTRY_DSN. The
 * index.html CSP only allows listed hosts, so a build with a DSN must also
 * allow that origin in connect-src, or every report is blocked.
 */

/** Return `html` with the DSN's origin added to the CSP connect-src. */
export function allowSentryInCsp(html, dsn) {
  if (!dsn) return html;
  let origin;
  try {
    const url = new URL(dsn);
    if (url.protocol !== 'https:' && url.protocol !== 'http:')
      throw new Error();
    origin = url.origin;
  } catch {
    throw new Error('VITE_SENTRY_DSN must be an http(s) Sentry DSN URL');
  }
  const pattern =
    /(http-equiv="Content-Security-Policy"\s+content="[^"]*connect-src )([^;"]*)/;
  if (!pattern.test(html)) {
    throw new Error('index.html CSP has no connect-src to extend for Sentry');
  }
  return html.replace(pattern, (_match, prefix, sources) =>
    sources.split(/\s+/).includes(origin)
      ? `${prefix}${sources}`
      : `${prefix}${sources} ${origin}`
  );
}

/** Vite plugin applying {@link allowSentryInCsp} with the resolved env. */
export function sentryCsp() {
  let dsn;
  return {
    name: 'fluxby-sentry-csp',
    configResolved(config) {
      dsn = config.env.VITE_SENTRY_DSN;
    },
    transformIndexHtml: (html) => allowSentryInCsp(html, dsn),
  };
}
