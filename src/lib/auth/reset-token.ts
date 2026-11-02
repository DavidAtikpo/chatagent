import { createHash, randomBytes } from "crypto";
import { queryOne, queryRows } from "@/lib/db";

const TOKEN_TTL_HOURS = 24;

function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export function generateResetToken(): string {
  return randomBytes(32).toString("base64url");
}

export async function createPasswordResetToken(userId: string): Promise<string> {
  const raw = generateResetToken();
  const tokenHash = hashToken(raw);
  const expires = new Date(Date.now() + TOKEN_TTL_HOURS * 60 * 60 * 1000);

  await queryRows(
    `UPDATE password_reset_tokens SET used_at = now()
     WHERE user_id = $1 AND used_at IS NULL`,
    [userId]
  );

  await queryRows(
    `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)`,
    [userId, tokenHash, expires.toISOString()]
  );

  return raw;
}

export async function verifyPasswordResetToken(raw: string): Promise<string | null> {
  const tokenHash = hashToken(raw);
  const row = await queryOne<{ user_id: string }>(
    `SELECT user_id FROM password_reset_tokens
     WHERE token_hash = $1
       AND used_at IS NULL
       AND expires_at > now()
     LIMIT 1`,
    [tokenHash]
  );
  return row?.user_id ?? null;
}

export async function markPasswordResetTokenUsed(raw: string): Promise<void> {
  const tokenHash = hashToken(raw);
  await queryRows(
    `UPDATE password_reset_tokens SET used_at = now() WHERE token_hash = $1`,
    [tokenHash]
  );
}
