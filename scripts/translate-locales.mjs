#!/usr/bin/env node
/**
 * Génère en.json, de.json, it.json, es.json, pt.json à partir de messages/fr.json
 * via l'API Anthropic (Claude).
 *
 * Usage:
 *   node scripts/translate-locales.mjs
 *   node scripts/translate-locales.mjs --locale en
 *   node scripts/translate-locales.mjs --dry-run
 *
 * Clé API : ANTHROPIC_API_KEY dans api/.env ou variable d'environnement
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const MESSAGES_DIR = path.join(ROOT, "messages");
const FR_PATH = path.join(MESSAGES_DIR, "fr.json");

const TARGETS = {
  en: "English",
  de: "German (Deutsch)",
  it: "Italian (italiano)",
  es: "Spanish (español)",
  pt: "Portuguese (português)",
};

const MODEL = process.env.CLAUDE_MODEL || "claude-sonnet-4-6";

function loadAnthropicKey() {
  if (process.env.ANTHROPIC_API_KEY?.trim()) {
    return process.env.ANTHROPIC_API_KEY.trim().replace(/\s+/g, "");
  }
  const envPaths = [
    path.join(ROOT, "..", "api", ".env"),
    path.join(ROOT, ".env.local"),
    path.join(ROOT, ".env"),
  ];
  for (const envPath of envPaths) {
    if (!fs.existsSync(envPath)) continue;
    const text = fs.readFileSync(envPath, "utf8");
    const match = text.match(/ANTHROPIC_API_KEY\s*=\s*([\s\S]*?)(?:\n[A-Z_][A-Z0-9_]*\s*=|\n#|$)/);
    if (match) {
      return match[1].replace(/\s+/g, "").replace(/^["']|["']$/g, "");
    }
  }
  return null;
}

function parseArgs() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const localeIdx = args.indexOf("--locale");
  const onlyLocale = localeIdx >= 0 ? args[localeIdx + 1] : null;
  return { dryRun, onlyLocale };
}

async function translateChunk(apiKey, targetLang, chunkJson) {
  const prompt = `You are a professional translator for a SaaS chatbot product website.

Translate the following JSON from French to ${targetLang}.

Rules:
- Keep the EXACT same JSON structure and all keys unchanged
- Translate only string VALUES
- Preserve placeholders like {saasName}, {name}, {plan} exactly
- Preserve HTML fragments like </body> if present
- Preserve emoji and special characters in values
- Keep brand names (ChatAgent, Facebook, Instagram, WordPress, Next.js, React, Claude, Render, WhatsApp, IRATA, CND) unchanged
- Return ONLY valid JSON, no markdown fences

JSON to translate:
${JSON.stringify(chunkJson, null, 2)}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 16000,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Anthropic API ${res.status}: ${err}`);
  }

  const data = await res.json();
  const text = data.content?.[0]?.text?.trim() ?? "";
  const cleaned = text.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
  return JSON.parse(cleaned);
}

function topLevelChunks(obj) {
  const chunks = {};
  for (const [key, value] of Object.entries(obj)) {
    chunks[key] = value;
  }
  return chunks;
}

function mergeChunks(translatedChunks) {
  return { ...translatedChunks };
}

async function translateLocale(apiKey, locale, frData, dryRun) {
  const langLabel = TARGETS[locale];
  if (!langLabel) throw new Error(`Locale inconnue: ${locale}`);

  console.log(`\n→ Traduction ${locale} (${langLabel})...`);
  const chunks = topLevelChunks(frData);
  const translatedChunks = {};

  for (const [section, chunk] of Object.entries(chunks)) {
    console.log(`  · section "${section}"`);
    if (dryRun) {
      translatedChunks[section] = chunk;
      continue;
    }
    const wrapped = { [section]: chunk };
    const result = await translateChunk(apiKey, langLabel, wrapped);
    translatedChunks[section] = result[section];
    await new Promise((r) => setTimeout(r, 500));
  }

  const merged = mergeChunks(translatedChunks);
  merged.meta = {
    locale,
    label: {
      en: "English",
      de: "Deutsch",
      it: "Italiano",
      es: "Español",
      pt: "Português",
    }[locale],
  };

  const outPath = path.join(MESSAGES_DIR, `${locale}.json`);
  if (dryRun) {
    console.log(`  (dry-run) écrirait ${outPath}`);
    return;
  }

  fs.writeFileSync(outPath, `${JSON.stringify(merged, null, 2)}\n`, "utf8");
  console.log(`  ✓ ${outPath}`);
}

async function main() {
  const { dryRun, onlyLocale } = parseArgs();

  if (!fs.existsSync(FR_PATH)) {
    console.error(`Fichier source introuvable: ${FR_PATH}`);
    process.exit(1);
  }

  const frData = JSON.parse(fs.readFileSync(FR_PATH, "utf8"));
  const apiKey = loadAnthropicKey();

  if (!apiKey && !dryRun) {
    console.error(
      "ANTHROPIC_API_KEY introuvable. Définissez-la dans api/.env ou en variable d'environnement."
    );
    process.exit(1);
  }

  const locales = onlyLocale ? [onlyLocale] : Object.keys(TARGETS);
  for (const locale of locales) {
    if (!TARGETS[locale]) {
      console.error(`Locale non supportée: ${locale}`);
      process.exit(1);
    }
    await translateLocale(apiKey, locale, frData, dryRun);
  }

  console.log("\nTerminé.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
