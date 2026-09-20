import { spawn } from 'node:child_process';

const command = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const child = spawn(
  command,
  [
    'run',
    'dev',
    '-w',
    'apps/web',
    '--',
    '--host',
    '0.0.0.0',
    '--port',
    '443',
  ],
  {
    stdio: 'inherit',
    env: {
      ...process.env,
      FLUXBY_DEV_HOST: 'fluxby.local',
      FLUXBY_DEV_HTTPS: 'true',
      FLUXBY_DEV_PORT: '443',
    },
  }
);

child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});
