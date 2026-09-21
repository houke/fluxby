import {
  chmodSync,
  chownSync,
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
} from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import os from 'node:os';

const scriptsDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptsDirectory, '..');

function getOriginalUserInfo() {
  if (process.platform !== 'darwin' || process.getuid?.() !== 0) {
    return null;
  }

  const sudoUid = Number(process.env.SUDO_UID);
  const ownerUid = Number.isInteger(sudoUid)
    ? sudoUid
    : statSync(projectRoot).uid;

  try {
    const sudoUser =
      process.env.SUDO_USER && process.env.SUDO_USER !== 'root'
        ? process.env.SUDO_USER
        : undefined;
    const ownerName =
      sudoUser ||
      execFileSync('/usr/bin/id', ['-un', String(ownerUid)], {
        encoding: 'utf8',
      }).trim();
    if (ownerName && ownerName !== 'root') {
      const uid = Number(
        execFileSync('/usr/bin/id', ['-u', ownerName], {
          encoding: 'utf8',
        }).trim()
      );
      const gid = Number(
        execFileSync('/usr/bin/id', ['-g', ownerName], {
          encoding: 'utf8',
        }).trim()
      );
      return {
        username: ownerName,
        uid,
        gid,
        homedir: path.join('/Users', ownerName),
      };
    }
  } catch {
    // Fall through to root's home if the original user cannot be resolved.
  }

  return null;
}

const originalUserInfo = getOriginalUserInfo();
const loginHome = originalUserInfo?.homedir ?? os.homedir();
const certificateDirectory =
  process.platform === 'darwin'
    ? path.join(loginHome, 'Library', 'Caches', 'Fluxby', 'dev-certs')
    : path.join(loginHome, '.cache', 'fluxby', 'dev-certs');
const keyPath = path.join(certificateDirectory, 'fluxby.local-key.pem');
const certificatePath = path.join(
  certificateDirectory,
  'fluxby.local-cert.pem'
);
const loginKeychainPath = path.join(
  loginHome,
  'Library',
  'Keychains',
  'login.keychain-db'
);

function runSecurityCommand(args) {
  if (process.getuid?.() === 0 && originalUserInfo) {
    return execFileSync(
      '/usr/bin/sudo',
      ['-u', originalUserInfo.username, '--', '/usr/bin/security', ...args],
      { stdio: 'ignore' }
    );
  }

  return execFileSync('/usr/bin/security', args, { stdio: 'ignore' });
}

/**
 * Create a one-year certificate for the local production-like hostname.
 * The files are intentionally kept out of git and reused until renewal.
 */
function createCertificate() {
  mkdirSync(certificateDirectory, { recursive: true });

  const temporaryKeyPath = path.join(
    certificateDirectory,
    `.fluxby.local-key-${process.pid}.tmp.pem`
  );
  const temporaryCertificatePath = path.join(
    certificateDirectory,
    `.fluxby.local-cert-${process.pid}.tmp.pem`
  );

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
        temporaryKeyPath,
        '-out',
        temporaryCertificatePath,
        '-days',
        '365',
        '-subj',
        '/CN=fluxby.local',
        '-addext',
        'basicConstraints=critical,CA:FALSE',
        '-addext',
        'keyUsage=critical,digitalSignature,keyEncipherment',
        '-addext',
        'extendedKeyUsage=serverAuth',
        '-addext',
        'subjectAltName=DNS:fluxby.local,DNS:localhost,IP:127.0.0.1',
      ],
      { stdio: 'ignore' }
    );
    chmodSync(temporaryKeyPath, 0o600);
    renameSync(temporaryKeyPath, keyPath);
    renameSync(temporaryCertificatePath, certificatePath);
  } catch (error) {
    rmSync(temporaryKeyPath, { force: true });
    rmSync(temporaryCertificatePath, { force: true });
    throw new Error(
      `Could not create the local HTTPS certificate with OpenSSL. Install OpenSSL and retry. ${String(error)}`
    );
  }
}

function restoreOriginalUserOwnership() {
  if (process.platform !== 'darwin' || process.getuid?.() !== 0) {
    return;
  }

  const originalUser = getOriginalUserInfo();
  if (!originalUser) return;

  const { uid, gid } = originalUser;
  chownSync(certificateDirectory, uid, gid);
  chownSync(keyPath, uid, gid);
  chownSync(certificatePath, uid, gid);
}

export function getLocalHttpsOptions({ refresh = false } = {}) {
  let certificateNeedsRenewal = refresh;
  if (!certificateNeedsRenewal && existsSync(certificatePath)) {
    try {
      execFileSync('openssl', [
        'x509',
        '-checkend',
        String(30 * 24 * 60 * 60),
        '-noout',
        '-in',
        certificatePath,
      ], { stdio: 'ignore' });
    } catch {
      certificateNeedsRenewal = true;
    }
  }

  if (
    certificateNeedsRenewal ||
    !existsSync(keyPath) ||
    !existsSync(certificatePath)
  ) {
    createCertificate();
    restoreOriginalUserOwnership();
  }

  return {
    key: readFileSync(keyPath),
    cert: readFileSync(certificatePath),
  };
}

/**
 * Trust the development certificate in the current macOS user's login
 * keychain. Chrome uses this trust store, so the local HTTPS origin behaves
 * like a normal trusted development site after the first `npm run dev`.
 */
export function ensureLocalCertificateTrust() {
  if (process.platform !== 'darwin') {
    console.warn(
      'The local HTTPS certificate is self-signed. Trust it manually in your operating system if the browser shows a certificate warning.'
    );
    return;
  }

  try {
    runSecurityCommand(['verify-cert', '-c', certificatePath]);
    return;
  } catch {
    // The certificate is not trusted yet; add it to the user's login keychain.
  }

  try {
    runSecurityCommand([
      'add-trusted-cert',
      '-r',
      'trustRoot',
      '-k',
      loginKeychainPath,
      certificatePath,
    ]);
  } catch (error) {
    throw new Error(
      `Could not trust the local HTTPS certificate in the macOS login keychain. ${String(error)}`
    );
  }
}
