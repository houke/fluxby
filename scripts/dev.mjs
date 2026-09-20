import { spawn } from 'node:child_process';
import {
  ensureLocalCertificateTrust,
  getLocalHttpsOptions,
} from './dev-cert.mjs';

const command = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const landingPort = Number(process.env.FLUXBY_DEV_FRONT_PORT || 443);

if (
  landingPort < 1024 &&
  process.platform !== 'win32' &&
  process.getuid?.() !== 0
) {
  console.error(
    `Port ${landingPort} requires administrator permission. Run: sudo npm run dev`
  );
  process.exit(1);
}

const sharedEnvironment = {
  ...process.env,
  FLUXBY_DEV_HOST: 'fluxby.local',
  FLUXBY_DEV_HTTPS: 'true',
};

// Create and trust the certificate once before either Vite process starts.
getLocalHttpsOptions({ refresh: true });
ensureLocalCertificateTrust();

const apps = [
  { workspace: 'apps/landing', port: landingPort },
  { workspace: 'apps/web', port: 5178 },
];

const children = apps.map(({ workspace, port }) =>
  spawn(
    command,
    [
      'run',
      'dev',
      '-w',
      workspace,
      '--',
      '--host',
      '0.0.0.0',
      '--port',
      String(port),
    ],
    {
      stdio: 'inherit',
      env: { ...sharedEnvironment, FLUXBY_DEV_PORT: String(port) },
    }
  )
);

let shuttingDown = false;

function shutdown(exitCode) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) child.kill('SIGTERM');
  globalThis.setTimeout(() => process.exit(exitCode), 250);
}

for (const child of children) {
  child.on('error', () => shutdown(1));
  child.on('exit', (code) => {
    if (!shuttingDown && code !== 0) shutdown(code ?? 1);
  });
}

process.once('SIGINT', () => shutdown(0));
process.once('SIGTERM', () => shutdown(0));
