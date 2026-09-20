import { chmodSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const scriptsDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptsDirectory, '..');
const certificateDirectory = path.join(projectRoot, '.certs');
const keyPath = path.join(certificateDirectory, 'fluxby.local-key.pem');
const certificatePath = path.join(
  certificateDirectory,
  'fluxby.local-cert.pem'
);

/**
 * Create a short-lived certificate for the local production-like hostname.
 * The files are intentionally kept out of git and recreated when absent.
 */
export function getLocalHttpsOptions() {
  if (!existsSync(keyPath) || !existsSync(certificatePath)) {
    mkdirSync(certificateDirectory, { recursive: true });

    try {
      execFileSync(
        'openssl',
        [
          'req',
          '-x509',
          '-newkey',
          'rsa:2048',
          '-nodes',
          '-keyout',
          keyPath,
          '-out',
          certificatePath,
          '-days',
          '30',
          '-subj',
          '/CN=fluxby.local',
          '-addext',
          'subjectAltName=DNS:fluxby.local,DNS:localhost,IP:127.0.0.1',
        ],
        { stdio: 'ignore' }
      );
      chmodSync(keyPath, 0o600);
    } catch (error) {
      throw new Error(
        `Could not create the local HTTPS certificate with OpenSSL. Install OpenSSL and retry. ${String(error)}`
      );
    }
  }

  return {
    key: readFileSync(keyPath),
    cert: readFileSync(certificatePath),
  };
}
