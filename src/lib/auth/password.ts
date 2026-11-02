import { compareSync } from "bcryptjs";
import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

const KEY_LEN = 64;
const BCRYPT_PREFIX = "bcrypt:";

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, KEY_LEN).toString("hex");
  return `${salt}:${hash}`;
}

export function passwordNeedsUpgrade(stored: string): boolean {
  return stored.startsWith(BCRYPT_PREFIX);
}

export function verifyPassword(password: string, stored: string): boolean {
  if (stored.startsWith(BCRYPT_PREFIX)) {
    try {
      return compareSync(password, stored.slice(BCRYPT_PREFIX.length));
    } catch {
      return false;
    }
  }
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const derived = scryptSync(password, salt, KEY_LEN);
  const expected = Buffer.from(hash, "hex");
  if (expected.length !== derived.length) return false;
  return timingSafeEqual(expected, derived);
}
