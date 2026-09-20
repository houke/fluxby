import type { ServerOptions } from 'node:https';

export function getLocalHttpsOptions(): {
  key: NonNullable<ServerOptions['key']>;
  cert: NonNullable<ServerOptions['cert']>;
};
