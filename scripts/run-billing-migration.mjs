import fs from "fs";
import path from "path";
import { Pool } from "@neondatabase/serverless";

const envPath = path.join(process.cwd(), ".env.local");
const env = fs.readFileSync(envPath, "utf8");
const match = env.match(/^DATABASE_URL=(.+)$/m);
if (!match) {
  console.error("DATABASE_URL missing in .env.local");
  process.exit(1);
}
let url = match[1].trim();
const schemaMatch = url.match(/[?&]schema=([^&]+)/i);
const schema = schemaMatch ? decodeURIComponent(schemaMatch[1]) : null;
url = url.replace(/[?&]schema=[^&]+/i, "").replace(/[?&]$/, "");
url = url.replace("-pooler.", ".");
const pool = new Pool({ connectionString: url });
const client = await pool.connect();
try {
  if (schema) {
    await client.query(`SET search_path TO "${schema.replace(/"/g, "")}", public`);
  }
  const migration = fs.readFileSync(
    path.join(process.cwd(), "db/migrations/001_billing.sql"),
    "utf8"
  );
  const statements = migration
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);
  for (const stmt of statements) {
    await client.query(stmt);
  }
  console.log("Billing migration applied.");
} finally {
  client.release();
  await pool.end();
}
