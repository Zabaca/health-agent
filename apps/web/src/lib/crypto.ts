import crypto from 'crypto';
import { getConfiguration } from './config';

const ALGORITHM = 'aes-256-gcm';
const ENC_PREFIX = 'enc:';

function getKey(): Buffer {
  const { ENCRYPTION_KEY } = getConfiguration();
  return Buffer.from(ENCRYPTION_KEY, 'hex');
}

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * Returns a prefixed string: `enc:<iv_hex>:<authTag_hex>:<ciphertext_hex>`
 */
export function encrypt(plaintext: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${ENC_PREFIX}${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

/**
 * Decrypts a value produced by `encrypt()`.
 * If the value is not in encrypted format (legacy plain text), it is returned as-is.
 */
export function decrypt(value: string): string {
  if (!value.startsWith(ENC_PREFIX)) return value;

  const parts = value.slice(ENC_PREFIX.length).split(':');
  if (parts.length !== 3) return value;

  try {
    const [ivHex, authTagHex, dataHex] = parts;
    const key = getKey();
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const data = Buffer.from(dataHex, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
  } catch {
    // Decryption failed — return value as-is (handles corrupted or legacy data gracefully)
    return value;
  }
}

// ─── Binary (file) encryption ───────────────────────────────────────────────
// Layout: MAGIC(4) | iv(12) | authTag(16) | ciphertext. The magic prefix lets
// readers tell encrypted objects from legacy plaintext (decryptBuffer passes
// plaintext through unchanged — mirrors decrypt()'s `enc:` behavior).
const FILE_MAGIC = Buffer.from('ENC1', 'ascii');

export function isEncryptedBuffer(data: Buffer): boolean {
  return data.length >= FILE_MAGIC.length && data.subarray(0, FILE_MAGIC.length).equals(FILE_MAGIC);
}

/** Encrypts a binary buffer (e.g. an uploaded file) using AES-256-GCM. */
export function encryptBuffer(plaintext: Buffer): Buffer {
  const key = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([FILE_MAGIC, iv, authTag, encrypted]);
}

/** Decrypts a buffer produced by `encryptBuffer()`. Legacy/plaintext buffers are returned as-is. */
export function decryptBuffer(data: Buffer): Buffer {
  if (!isEncryptedBuffer(data)) return data;
  try {
    const iv = data.subarray(4, 16);
    const authTag = data.subarray(16, 32);
    const ciphertext = data.subarray(32);
    const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
    decipher.setAuthTag(authTag);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  } catch {
    // Corrupt/undecryptable — return as-is so the caller can decide.
    return data;
  }
}

/** Encrypt both SSN and DOB fields in an object, returning a new object with encrypted values. */
export function encryptPii<T extends { ssn?: string | null; dateOfBirth?: string | null }>(
  data: T
): T {
  const result = { ...data };
  if (result.ssn) result.ssn = encrypt(result.ssn);
  if (result.dateOfBirth) result.dateOfBirth = encrypt(result.dateOfBirth);
  return result;
}

/** Decrypt both SSN and DOB fields in an object, returning a new object with plaintext values. */
export function decryptPii<T extends { ssn?: string | null; dateOfBirth?: string | null }>(
  data: T
): T {
  const result = { ...data };
  if (result.ssn) result.ssn = decrypt(result.ssn);
  if (result.dateOfBirth) result.dateOfBirth = decrypt(result.dateOfBirth);
  return result;
}

/** Extract the last 4 digits from an SSN string, stripping any formatting. Returns null if no digits found. */
export function extractLast4Ssn(ssn: string): string | null {
  const digits = ssn.replace(/\D/g, '');
  return digits.length > 0 ? digits.slice(-4) : null;
}
