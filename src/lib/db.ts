import { Pool, type PoolClient } from "@neondatabase/serverless";

export type SqlRow = Record<string, unknown>;

let pool: Pool | null = null;
let cachedSchema: string | null | undefined;

/** Schéma Postgres (ex. Yayra) — param `schema=` dans DATABASE_URL ou DATABASE_SCHEMA. */
export function getDatabaseSchema(): string | null {
  if (cachedSchema !== undefined) return cachedSchema;

  const fromEnv = process.env.DATABASE_SCHEMA?.trim();
  if (fromEnv) {
    cachedSchema = fromEnv;
    return cachedSchema;
  }

  const raw = process.env.DATABASE_URL ?? "";
  const m = raw.match(/[?&]schema=([^&]+)/i);
  if (m) {
    cachedSchema = decodeURIComponent(m[1].replace(/"/g, ""));
    return cachedSchema;
  }

  cachedSchema = null;
  return null;
}

function sanitizeSchemaName(name: string): string {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) {
    throw new Error("Nom de schéma DATABASE invalide");
  }
  return name;
}

/** Neon pooler : pas de `options=search_path` — connexion directe (sans `-pooler`). */
export function neonConnectionString(raw: string): string {
  let url = raw.trim().replace(/[?&]schema=[^&]+/i, "");
  url = url.replace(/[?&]$/, "");
  url = url.replace("-pooler.", ".");
  return url;
}

export function getPool(): Pool {
  if (!pool) {
    const url = process.env.DATABASE_URL?.trim();
    if (!url) {
      throw new Error(
        "DATABASE_URL manquante — ajoutez-la dans chatagent/.env.local (voir .env.example)"
      );
    }
    pool = new Pool({ connectionString: neonConnectionString(url) });
  }
  return pool;
}

/** Exécute du SQL avec search_path Yayra (si configuré). */
export async function withDbClient<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await getPool().connect();
  try {
    const schema = getDatabaseSchema();
    if (schema) {
      const safe = sanitizeSchemaName(schema);
      await client.query(`SET search_path TO "${safe}", public`);
    }
    return await fn(client);
  } finally {
    client.release();
  }
}

export async function queryRows<T extends SqlRow = SqlRow>(
  query: string,
  params: unknown[] = []
): Promise<T[]> {
  return withDbClient(async (client) => {
    const result = await client.query(query, params);
    return result.rows as T[];
  });
}

export async function queryOne<T extends SqlRow = SqlRow>(
  query: string,
  params: unknown[] = []
): Promise<T | null> {
  const rows = await queryRows<T>(query, params);
  return rows[0] ?? null;
}
