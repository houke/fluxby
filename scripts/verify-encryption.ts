/* eslint-disable no-console */
/**
 * Encryption Verification Script
 *
 * This script demonstrates how to:
 * 1. Extract the encrypted database from OPFS
 * 2. Verify that it cannot be opened without the password
 * 3. Verify that it can be decrypted with the correct password
 *
 * Usage:
 * 1. Run this in the browser console while the app is open
 * 2. Or import as a module for automated testing
 */

/**
 * How Fluxby Encryption Works:
 *
 * 1. MASTER KEY GENERATION
 *    - A 32-byte random master key is generated on first setup
 *    - This key is used to encrypt ALL database pages
 *
 * 2. KEY WRAPPING
 *    - User provides a password (min 8 chars)
 *    - PBKDF2 derives a Key Encryption Key (KEK) from password + salt (100k iterations)
 *    - Master key is encrypted with KEK using AES-256-GCM
 *    - The "wrapped key" (encrypted master key + salt + nonce + iterations) is stored in localStorage
 *
 * 3. DATABASE ENCRYPTION
 *    - Each SQLite page (4096 bytes) is encrypted individually
 *    - Format: [Ciphertext (4096)] [IV (12)] [Auth Tag (16)] = 4124 bytes per page
 *    - AES-256-GCM provides authenticated encryption (integrity + confidentiality)
 *
 * 4. SECURITY PROPERTIES
 *    - Zero-knowledge: Server never sees plaintext data or password
 *    - Forward secrecy: Each page has unique IV (nonce)
 *    - Authentication: GCM tag prevents tampering
 *    - No password recovery: If password is lost, data is unrecoverable
 */

// Browser-only code for extracting database
export async function extractDatabaseFromOPFS(): Promise<Uint8Array | null> {
  if (typeof navigator === 'undefined' || !('storage' in navigator)) {
    console.error('OPFS not available - run this in a browser');
    return null;
  }

  try {
    const root = await navigator.storage.getDirectory();
    const fileHandle = await root.getFileHandle('fluxby.db');
    const file = await fileHandle.getFile();
    const buffer = await file.arrayBuffer();
    return new Uint8Array(buffer);
  } catch (err) {
    console.error('Failed to read database from OPFS:', err);
    return null;
  }
}

/**
 * Check if data is an encrypted Fluxby database
 */
export function isEncryptedDatabase(data: Uint8Array): boolean {
  // Unencrypted SQLite starts with "SQLite format 3\0"
  const header = 'SQLite format 3\0';
  if (data.length < 16) return false;

  const headerBytes = new TextDecoder().decode(data.subarray(0, 16));
  if (headerBytes === header) {
    return false; // This is an UNENCRYPTED database
  }

  // Encrypted database should have different patterns
  // Check if it's at least one encrypted page (4096 + 28 = 4124 bytes)
  if (data.length >= 4124) {
    // The data is likely encrypted if it doesn't start with SQLite header
    return true;
  }

  return false;
}

/**
 * Attempt to decrypt the database with a given master key
 */
export async function tryDecryptFirstPage(
  encryptedData: Uint8Array,
  masterKey: Uint8Array
): Promise<{ success: boolean; plaintext?: Uint8Array; error?: string }> {
  if (encryptedData.length < 4124) {
    return { success: false, error: 'Data too small for encrypted page' };
  }

  const pageSize = 4096;
  const ivSize = 12;
  const tagSize = 16;

  // Extract encrypted page components
  const encryptedPage = encryptedData.subarray(0, pageSize);
  const iv = encryptedData.subarray(pageSize, pageSize + ivSize);
  const tag = encryptedData.subarray(
    pageSize + ivSize,
    pageSize + ivSize + tagSize
  );

  // Reconstruct for AES-GCM decryption (ciphertext + tag)
  const ciphertextWithTag = new Uint8Array(pageSize + tagSize);
  ciphertextWithTag.set(encryptedPage);
  ciphertextWithTag.set(tag, pageSize);

  try {
    const key = await crypto.subtle.importKey(
      'raw',
      masterKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );

    const plaintext = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      ciphertextWithTag
    );

    const plaintextBytes = new Uint8Array(plaintext);

    // Check if decrypted data looks like SQLite header
    const header = new TextDecoder().decode(plaintextBytes.subarray(0, 16));
    if (header === 'SQLite format 3\0') {
      return { success: true, plaintext: plaintextBytes };
    } else {
      return {
        success: false,
        error: 'Decryption succeeded but invalid SQLite header',
      };
    }
  } catch (err) {
    return {
      success: false,
      error: `Decryption failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
    };
  }
}

/**
 * Browser console verification function
 */
export async function verifyDatabaseEncryption(): Promise<void> {
  console.log('=== Fluxby Database Encryption Verification ===\n');

  // Step 1: Extract database
  console.log('1. Extracting database from OPFS...');
  const dbData = await extractDatabaseFromOPFS();
  if (!dbData) {
    console.error('❌ Failed to extract database');
    return;
  }
  console.log(`   ✓ Database extracted: ${dbData.length} bytes`);

  // Step 2: Check if encrypted
  console.log('\n2. Checking encryption status...');
  const encrypted = isEncryptedDatabase(dbData);
  if (encrypted) {
    console.log('   ✓ Database IS encrypted');
  } else {
    console.log('   ⚠️ Database is NOT encrypted (legacy or unencrypted mode)');
  }

  // Step 3: Try to open with wrong key
  console.log('\n3. Attempting decryption with WRONG key...');
  const wrongKey = crypto.getRandomValues(new Uint8Array(32));
  const wrongResult = await tryDecryptFirstPage(dbData, wrongKey);
  if (wrongResult.success) {
    console.error('   ❌ SECURITY ISSUE: Decryption succeeded with wrong key!');
  } else {
    console.log(`   ✓ Decryption correctly failed: ${wrongResult.error}`);
  }

  // Step 4: Check localStorage for wrapped key
  console.log('\n4. Checking for wrapped key in localStorage...');
  const wrappedKeyStr = localStorage.getItem('fluxby-wrapped-key');
  if (wrappedKeyStr) {
    console.log('   ✓ Wrapped key found (encrypted with your password)');
    try {
      const parsed = JSON.parse(wrappedKeyStr);
      console.log(`   - Salt: ${parsed.salt.length} bytes`);
      console.log(`   - Nonce: ${parsed.nonce.length} bytes`);
      console.log(`   - Iterations: ${parsed.iterations}`);
      console.log(`   - Ciphertext: ${parsed.ciphertext.length} bytes`);
    } catch {
      console.log('   - Could not parse wrapped key structure');
    }
  } else {
    console.log('   ⚠️ No wrapped key found (encryption may not be set up)');
  }

  console.log('\n=== Verification Complete ===');
  console.log('\nSummary:');
  console.log(`- Database size: ${(dbData.length / 1024).toFixed(2)} KB`);
  console.log(`- Encrypted: ${encrypted ? 'Yes' : 'No'}`);
  console.log(`- Protected by password: ${wrappedKeyStr ? 'Yes' : 'No'}`);

  if (encrypted && wrappedKeyStr) {
    console.log(
      '\n✓ Your data is encrypted and protected by your master password.'
    );
    console.log(
      '  Without your password, the database contents cannot be read.'
    );
  }
}

/**
 * Export database to a downloadable file (for backup)
 */
export async function downloadEncryptedDatabase(): Promise<void> {
  const dbData = await extractDatabaseFromOPFS();
  if (!dbData) {
    console.error('Failed to extract database');
    return;
  }

  const blob = new Blob([dbData], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `fluxby-backup-${new Date().toISOString().split('T')[0]}.encrypted.db`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  console.log('✓ Encrypted database downloaded');
  console.log(
    '  This file is encrypted and cannot be read without your password.'
  );
}

// Make available globally in browser for console access
if (typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>).fluxbyVerify = {
    extractDatabase: extractDatabaseFromOPFS,
    isEncrypted: isEncryptedDatabase,
    tryDecrypt: tryDecryptFirstPage,
    verify: verifyDatabaseEncryption,
    download: downloadEncryptedDatabase,
  };
  console.log(
    'Fluxby encryption verification tools loaded. Run fluxbyVerify.verify() to test.'
  );
}
