/**
 * Token encryption utilities
 * AES-256-GCM encryption for GitHub tokens at rest
 * Per security_checklist.md Priority A item #2
 */

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // GCM recommended IV length
const AUTH_TAG_LENGTH = 16;

/**
 * Get encryption key from environment
 * Must be 32 bytes (256 bits)
 */
function getEncryptionKey(): Buffer {
  const key = process.env.TOKEN_ENCRYPTION_KEY;
  if (!key) {
    throw new Error('TOKEN_ENCRYPTION_KEY not set in environment');
  }
  
  // If key is provided as hex, decode it
  if (key.length === 64) {
    return Buffer.from(key, 'hex');
  }
  
  // Otherwise use as UTF-8 and hash to 32 bytes
  return crypto.createHash('sha256').update(key).digest();
}

/**
 * Encrypt a token for storage
 * Returns base64-encoded string: IV + AuthTag + Ciphertext
 */
export function encryptToken(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  
  const authTag = cipher.getAuthTag();
  
  // Combine: IV (12) + AuthTag (16) + Ciphertext
  const combined = Buffer.concat([iv, authTag, encrypted]);
  return combined.toString('base64');
}

/**
 * Decrypt a token from storage
 * Expects base64-encoded string: IV + AuthTag + Ciphertext
 */
export function decryptToken(encryptedData: string): string {
  const key = getEncryptionKey();
  const combined = Buffer.from(encryptedData, 'base64');
  
  // Extract parts
  const iv = combined.subarray(0, IV_LENGTH);
  const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const ciphertext = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  
  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);
  
  return decrypted.toString('utf8');
}

/**
 * Verify encryption is working (call on startup)
 */
export function verifyEncryption(): boolean {
  try {
    const testValue = 'test-encryption-' + Date.now();
    const encrypted = encryptToken(testValue);
    const decrypted = decryptToken(encrypted);
    return decrypted === testValue;
  } catch {
    return false;
  }
}
