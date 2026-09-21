/* global Headers, Response, URL, fetch */

const UPSTREAM_URL = 'https://api.typesafe.ai/v1/systemone';
const ALLOWED_ORIGINS = new Set([
  'https://fluxby.app',
  'https://www.fluxby.app',
]);

function corsHeaders(origin) {
  const headers = new Headers({
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Max-Age': '600',
    Vary: 'Origin',
  });

  if (origin && ALLOWED_ORIGINS.has(origin)) {
    headers.set('Access-Control-Allow-Origin', origin);
  }

  return headers;
}

function jsonResponse(body, status, origin) {
  const headers = corsHeaders(origin);
  headers.set('Content-Type', 'application/json');
  return new Response(JSON.stringify(body), { status, headers });
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin');

    if (url.pathname !== '/typesafe/systemone') {
      return jsonResponse({ error: 'Not found' }, 404, origin);
    }

    if (!origin || !ALLOWED_ORIGINS.has(origin)) {
      return jsonResponse({ error: 'Origin not allowed' }, 403, origin);
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    if (request.method !== 'POST') {
      return jsonResponse({ error: 'Method not allowed' }, 405, origin);
    }

    const contentLength = Number(request.headers.get('Content-Length') || 0);
    if (contentLength > 1_000_000) {
      return jsonResponse({ error: 'Request body too large' }, 413, origin);
    }

    const authorization = request.headers.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) {
      return jsonResponse({ error: 'Authorization required' }, 401, origin);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ error: 'Request body must be valid JSON' }, 400, origin);
    }

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return jsonResponse({ error: 'Request body must be a JSON object' }, 400, origin);
    }

    try {
      const upstream = await fetch(UPSTREAM_URL, {
        method: 'POST',
        headers: {
          Authorization: authorization,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const responseHeaders = corsHeaders(origin);
      responseHeaders.set(
        'Content-Type',
        upstream.headers.get('Content-Type') || 'application/json'
      );

      return new Response(upstream.body, {
        status: upstream.status,
        headers: responseHeaders,
      });
    } catch {
      return jsonResponse({ error: 'TypeSafe request failed' }, 502, origin);
    }
  },
};
