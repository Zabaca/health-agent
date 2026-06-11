import bcryptjs from "bcryptjs";

/**
 * Canonical email normalization. Emails are stored and looked up lowercased +
 * trimmed everywhere (registration, credentials sign-in, invites, password
 * reset) so casing never causes a missed match or a duplicate account. Use this
 * at every storage/lookup boundary rather than inlining `.toLowerCase().trim()`.
 */
export function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

export async function hashPassword(password: string): Promise<string> {
  return bcryptjs.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcryptjs.compare(password, hashedPassword);
}
