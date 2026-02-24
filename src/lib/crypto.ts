import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const ENC_PREFIX = 'enc:';

function getKey(): Buffer {
  const hex = process.env.ENCRYPTION_KEY;
  if (!hex) throw new Error('ENCRYPTION_KEY environment variable is not set');
  return Buffer.from(hex, 'hex');
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
