import type { ServerOptions } from 'node:https';

export function getLocalHttpsOptions(options?: { refresh?: boolean }): {
  key: NonNullable<ServerOptions['key']>;
  cert: NonNullable<ServerOptions['cert']>;
};

export function ensureLocalCertificateTrust(): void;
