#!/usr/bin/env node
/**
 * Synchronise la structure de fr.json vers en/de/it/es/pt SANS appel API.
 * Les clés déjà traduites sont conservées ; les nouvelles clés reçoivent le texte français (repli).
 *
 * Usage: npm run i18n:sync
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MESSAGES_DIR = path.join(__dirname, "..", "messages");
const FR_PATH = path.join(MESSAGES_DIR, "fr.json");
const TARGETS = ["en", "de", "it", "es", "pt"];

function deepMerge(base, overlay) {
  if (overlay == null) return base;
  if (base == null) return overlay;
  if (Array.isArray(overlay)) return overlay.length ? overlay : base;
  if (typeof overlay !== "object" || typeof base !== "object") return overlay;

  const result = { ...base };
  for (const [key, value] of Object.entries(overlay)) {
    result[key] = deepMerge(base[key], value);
  }
  return result;
}

function main() {
  if (!fs.existsSync(FR_PATH)) {
    console.error(`Introuvable: ${FR_PATH}`);
    process.exit(1);
  }

  const fr = JSON.parse(fs.readFileSync(FR_PATH, "utf8"));

  for (const locale of TARGETS) {
    const outPath = path.join(MESSAGES_DIR, `${locale}.json`);
    let existing = {};
    if (fs.existsSync(outPath)) {
      existing = JSON.parse(fs.readFileSync(outPath, "utf8"));
    }

    const merged = deepMerge(fr, existing);
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

    fs.writeFileSync(outPath, `${JSON.stringify(merged, null, 2)}\n`, "utf8");
    console.log(`✓ ${outPath}`);
  }

  console.log(
    "\nSync terminé. Textes manquants = français (repli).\n" +
      "Puis : npm run i18n:translate (traduit seulement les nouvelles clés)"
  );
}

main();
