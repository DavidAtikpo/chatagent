import type { PoolClient } from "@neondatabase/serverless";

import { withDbClient } from "@/lib/db";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DbResult<T = any> = { data: T | null; error: { message: string; code?: string } | null; count?: number | null };

class TableQuery {
  private filters: string[] = [];
  private filterParams: unknown[] = [];
  private orderClause = "";
  private limitN: number | null = null;
  private selectCols = "*";
  private countHead = false;
  private insertRow: Record<string, unknown> | Record<string, unknown>[] | null = null;
  private updateRow: Record<string, unknown> | null = null;
  private upsertRow: Record<string, unknown> | null = null;
  private upsertConflict: string | null = null;
  private isDelete = false;
  private returning = false;
  private singleMode: "none" | "single" | "maybe" = "none";

  constructor(
    private table: string,
    private mode: "select" | "insert" | "update" | "delete" | "upsert" = "select"
  ) {}

  select(columns: string, opts?: { count?: "exact"; head?: boolean }) {
    this.selectCols = columns;
    if (opts?.count === "exact" && opts?.head) {
      this.countHead = true;
    }
    return this;
  }

  insert(row: Record<string, unknown> | Record<string, unknown>[]) {
    this.mode = "insert";
    this.insertRow = row;
    return this;
  }

  update(row: Record<string, unknown>) {
    this.mode = "update";
    this.updateRow = row;
    return this;
  }

  upsert(row: Record<string, unknown>, opts?: { on_conflict?: string }) {
    this.mode = "upsert";
    this.upsertRow = row;
    this.upsertConflict = opts?.on_conflict ?? null;
    return this;
  }

  delete() {
    this.mode = "delete";
    this.isDelete = true;
    return this;
  }

  eq(column: string, value: unknown) {
    this.filters.push(`${column} = $${this.nextParamIndex()}`);
    this.filterParams.push(value);
    return this;
  }

  in(column: string, values: unknown[]) {
    this.filters.push(`${column} = ANY($${this.nextParamIndex()}::uuid[])`);
    this.filterParams.push(values);
    return this;
  }

  is(column: string, value: null | "null") {
    if (value === null || value === "null") {
      this.filters.push(`${column} IS NULL`);
    }
    return this;
  }

  order(column: string, opts?: { ascending?: boolean }) {
    const dir = opts?.ascending === false ? "DESC" : "ASC";
    this.orderClause = `ORDER BY ${column} ${dir}`;
    return this;
  }

  limit(n: number) {
    this.limitN = n;
    return this;
  }

  gte(column: string, value: unknown) {
    this.filters.push(`${column} >= $${this.nextParamIndex()}`);
    this.filterParams.push(value);
    return this;
  }

  not(column: string, operator: string, value: unknown) {
    if (operator === "is" && value === null) {
      this.filters.push(`${column} IS NOT NULL`);
    } else if (operator === "eq") {
      this.filters.push(`${column} <> $${this.nextParamIndex()}`);
      this.filterParams.push(value);
    }
    return this;
  }

  then<TResult1 = DbResult, TResult2 = never>(
    onfulfilled?: ((value: DbResult) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }

  single() {
    this.singleMode = "single";
    this.returning = true;
    return this;
  }

  maybeSingle() {
    this.singleMode = "maybe";
    this.returning = true;
    return this;
  }

  private nextParamIndex() {
    return this.filterParams.length + 1;
  }

  async execute(): Promise<DbResult> {
    try {
      return await withDbClient((client) => this.run(client));
    } catch (err) {
      const pg = err as { code?: string; message?: string };
      return { data: null, error: { message: pg.message ?? "Erreur DB", code: pg.code } };
    }
  }

  private async run(p: PoolClient): Promise<DbResult> {
    if (this.mode === "select") {
      if (this.countHead) {
        const where = this.filters.length ? `WHERE ${this.filters.join(" AND ")}` : "";
        const res = await p.query(
          `SELECT COUNT(*)::int AS count FROM ${this.table} ${where}`,
          this.filterParams
        );
        return { data: null, error: null, count: res.rows[0]?.count ?? 0 };
      }
      const where = this.filters.length ? `WHERE ${this.filters.join(" AND ")}` : "";
      const limit = this.limitN != null ? `LIMIT ${this.limitN}` : "";
      const sql = `SELECT ${this.selectCols} FROM ${this.table} ${where} ${this.orderClause} ${limit}`.trim();
      const res = await p.query(sql, this.filterParams);
      let data: unknown = res.rows;
      if (this.singleMode === "single") {
        if (!res.rows[0]) {
          return { data: null, error: { message: "No rows", code: "PGRST116" } };
        }
        data = res.rows[0];
      } else if (this.singleMode === "maybe") {
        data = res.rows[0] ?? null;
      }
      return { data, error: null, count: res.rowCount };
    }

    if (this.mode === "insert" && this.insertRow) {
      const rows = Array.isArray(this.insertRow) ? this.insertRow : [this.insertRow];
      const keys = Object.keys(rows[0]);
      const placeholders = rows
        .map((_, ri) => `(${keys.map((_, ci) => `$${ri * keys.length + ci + 1}`).join(", ")})`)
        .join(", ");
      const values = rows.flatMap((r) => keys.map((k) => r[k]));
      const returning =
        this.returning || this.singleMode !== "none"
          ? `RETURNING ${this.selectCols === "*" ? "*" : this.selectCols}`
          : "";
      const sql = `INSERT INTO ${this.table} (${keys.join(", ")}) VALUES ${placeholders} ${returning}`;
      const res = await p.query(sql, values);
      return this.finishWrite(res.rows);
    }

    if (this.mode === "update" && this.updateRow) {
      const keys = Object.keys(this.updateRow);
      const set = keys.map((k, i) => `${k} = $${i + 1}`).join(", ");
      const offset = keys.length;
      const where = this.filters
        .map((f, i) => f.replace(/\$(\d+)/g, (_, n) => `$${Number(n) + offset}`))
        .join(" AND ");
      const returning =
        this.returning || this.singleMode !== "none"
          ? `RETURNING ${this.selectCols === "*" ? "*" : this.selectCols}`
          : "";
      const sql = `UPDATE ${this.table} SET ${set}${where ? ` WHERE ${where}` : ""} ${returning}`;
      const res = await p.query(sql, [...keys.map((k) => this.updateRow![k]), ...this.filterParams]);
      return this.finishWrite(res.rows);
    }

    if (this.mode === "delete") {
      const where = this.filters.length ? `WHERE ${this.filters.join(" AND ")}` : "";
      const sql = `DELETE FROM ${this.table} ${where}`;
      await p.query(sql, this.filterParams);
      return { data: null, error: null };
    }

    if (this.mode === "upsert" && this.upsertRow) {
      const keys = Object.keys(this.upsertRow);
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(", ");
      const updates = keys.map((k) => `${k} = EXCLUDED.${k}`).join(", ");
      const conflict = this.upsertConflict ?? keys[0];
      const sql = `INSERT INTO ${this.table} (${keys.join(", ")}) VALUES (${placeholders})
          ON CONFLICT (${conflict}) DO UPDATE SET ${updates} RETURNING *`;
      const res = await p.query(sql, keys.map((k) => this.upsertRow![k]));
      return this.finishWrite(res.rows);
    }

    return { data: null, error: { message: "Requête invalide" } };
  }

  private finishWrite(rows: unknown[]): DbResult {
    if (this.singleMode === "single") {
      if (!rows[0]) return { data: null, error: { message: "No rows" } };
      return { data: rows[0], error: null };
    }
    if (this.singleMode === "maybe") {
      return { data: rows[0] ?? null, error: null };
    }
    return { data: rows, error: null };
  }
}

class PostgresAdminClient {
  from(table: string) {
    return new TableQuery(table);
  }

  auth = {
    admin: {
      async getUserById(userId: string) {
        return withDbClient(async (p) => {
          const res = await p.query(`SELECT id, email FROM app_users WHERE id = $1`, [userId]);
          const row = res.rows[0];
          return { data: { user: row ? { id: row.id, email: row.email } : null } };
        });
      },
      async listUsers(_opts?: { page?: number; perPage?: number }) {
        return withDbClient(async (p) => {
          const res = await p.query(
            `SELECT id, email FROM app_users ORDER BY created_at DESC LIMIT 1000`
          );
          return {
            data: { users: res.rows.map((r) => ({ id: r.id, email: r.email })) },
            error: null as { message: string } | null,
          };
        });
      },
      async inviteUserByEmail(email: string, _options?: { redirectTo?: string }) {
        return withDbClient(async (p) => {
          const existing = await p.query(`SELECT id, email FROM app_users WHERE email = $1`, [
            email.toLowerCase(),
          ]);
          if (existing.rows[0]) {
            return { data: { user: existing.rows[0] }, error: null };
          }
          const created = await p.query(
            `INSERT INTO app_users (email, password_hash) VALUES ($1, NULL) RETURNING id, email`,
            [email.toLowerCase()]
          );
          return {
            data: { user: created.rows[0] },
            error: null as { message: string } | null,
          };
        });
      },
    },
  };

  storage = {
    from: () => ({
      upload: async () => ({ error: { message: "Utilisez Cloudinary (uploadToCloudinary)" } }),
      getPublicUrl: () => ({ data: { publicUrl: "" } }),
      list: async () => ({ data: [] }),
      remove: async () => ({ error: null }),
    }),
  };
}

export function createAdminClient() {
  return new PostgresAdminClient();
}

export type PostgresAdmin = PostgresAdminClient;
