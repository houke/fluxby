import type { Plugin } from 'vite';

export function allowSentryInCsp(html: string, dsn: string | undefined): string;

export function sentryCsp(): Plugin;
