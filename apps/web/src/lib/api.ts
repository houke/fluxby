/**
 * API module - Local-first OPFS database access
 *
 * This module re-exports from api-compat.ts which provides the same interface
 * as the old HTTP-based api.ts but uses the local OPFS database instead.
 *
 * For the HTTP API client (for developers building custom interfaces),
 * see api-http.ts
 */
export * from './api-compat';
