import { queryOne, queryRows } from "@/lib/db";

export async function findUserByEmail(email: string) {
  return queryOne<{ id: string; email: string }>(
    `SELECT id, email FROM app_users WHERE email = $1`,
    [email.trim().toLowerCase()]
  );
}

export async function createInvitedUser(email: string) {
  return queryOne<{ id: string; email: string }>(
    `INSERT INTO app_users (email, password_hash)
     VALUES ($1, NULL)
     ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
     RETURNING id, email`,
    [email.trim().toLowerCase()]
  );
}

export async function getUserEmailById(userId: string) {
  const row = await queryOne<{ email: string }>(`SELECT email FROM app_users WHERE id = $1`, [userId]);
  return row?.email ?? null;
}

export async function listUsersByIds(ids: string[]) {
  if (!ids.length) return new Map<string, string>();
  const rows = await queryRows<{ id: string; email: string }>(
    `SELECT id, email FROM app_users WHERE id = ANY($1::uuid[])`,
    [ids]
  );
  return new Map(rows.map((r) => [r.id, r.email]));
}
