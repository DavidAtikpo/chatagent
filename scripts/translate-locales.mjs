#!/usr/bin/env node
/**
 * Génère / met à jour en.json, de.json, it.json, es.json, pt.json depuis fr.json
 * via Google Translate (google-translate-api-x).
 *
 * Par défaut : INCRÉMENTAL — ne retraduit que les clés manquantes ou encore en français.
 *
 * Usage:
 *   npm run i18n:translate                    # nouvelles clés seulement
 *   npm run i18n:translate -- --locale en
 *   npm run i18n:translate -- --section home    # une section fr.json
 *   npm run i18n:translate -- --force         # tout retraduire
 *   npm run i18n:translate -- --dry-run
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import translate from "google-translate-api-x";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const MESSAGES_DIR = path.join(ROOT, "messages");
const FR_PATH = path.join(MESSAGES_DIR, "fr.json");

const TARGETS = {
  en: { label: "English", google: "en" },
  de: { label: "Deutsch", google: "de" },
  it: { label: "Italiano", google: "it" },
  es: { label: "Español", google: "es" },
  pt: { label: "Português", google: "pt" },
};

const DELAY_MS = Number(process.env.I18N_TRANSLATE_DELAY_MS || 120);

function parseArgs() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const force = args.includes("--force");
  const localeIdx = args.indexOf("--locale");
  const onlyLocale = localeIdx >= 0 ? args[localeIdx + 1] : null;
  const sectionIdx = args.indexOf("--section");
  const onlySection = sectionIdx >= 0 ? args[sectionIdx + 1] : null;
  return { dryRun, force, onlyLocale, onlySection };
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function protectPlaceholders(text) {
  const map = new Map();
  let i = 0;
  const protectedText = text.replace(/\{(\w+)\}/g, (original) => {
    const token = `⟦PH${i}⟧`;
    map.set(token, original);
    i += 1;
    return token;
  });
  return { protectedText, map };
}

function restorePlaceholders(text, map) {
  let out = text;
  for (const [token, original] of map) {
    out = out.split(token).join(original);
  }
  return out;
}

async function translateString(text, googleLocale) {
  if (!text || typeof text !== "string" || !text.trim()) return text;

  const { protectedText, map } = protectPlaceholders(text);
  await sleep(DELAY_MS);

  const res = await translate(protectedText, {
    from: "fr",
    to: googleLocale,
    autoCorrect: false,
  });

  return restorePlaceholders(res.text, map);
}

function needsTranslation(frValue, existingValue, force) {
  if (force) return true;
  if (existingValue == null) return true;
  if (typeof existingValue !== "string") return true;
  // Identique au français = clé nouvelle (i18n:sync) ou jamais traduite
  return existingValue === frValue;
}

/**
 * Fusionne fr + locale existante : conserve les traductions, traduit le reste.
 */
async function mergeIncremental(frNode, existingNode, googleLocale, stats, keyPath, opts) {
  if (typeof frNode === "string") {
    if (keyPath === "meta.locale") return undefined;

    if (!needsTranslation(frNode, existingNode, opts.force)) {
      stats.kept += 1;
      return existingNode;
    }

    stats.translated += 1;
    if (opts.dryRun) {
      return `[${googleLocale}] ${frNode}`;
    }
    return translateString(frNode, googleLocale);
  }

  if (Array.isArray(frNode)) {
    const out = [];
    for (let i = 0; i < frNode.length; i += 1) {
      const childPath = `${keyPath}[${i}]`;
      out.push(
        await mergeIncremental(
          frNode[i],
          Array.isArray(existingNode) ? existingNode[i] : undefined,
          googleLocale,
          stats,
          childPath,
          opts
        )
      );
    }
    return out;
  }

  if (frNode && typeof frNode === "object") {
    const out = {};
    for (const [key, value] of Object.entries(frNode)) {
      const childPath = keyPath ? `${keyPath}.${key}` : key;
      if (childPath === "meta.locale") continue;

      const childExisting =
        existingNode && typeof existingNode === "object" ? existingNode[key] : undefined;

      out[key] = await mergeIncremental(
        value,
        childExisting,
        googleLocale,
        stats,
        childPath,
        opts
      );
    }
    return out;
  }

  return frNode;
}

function pickSection(data, section) {
  if (!section) return data;
  if (!(section in data)) {
    throw new Error(`Section introuvable dans fr.json : "${section}"`);
  }
  return { [section]: data[section] };
}

function mergeSectionIntoFull(full, section, partial) {
  if (!section) return partial;
  return { ...full, [section]: partial[section] };
}

async function translateLocale(locale, frData, opts) {
  const target = TARGETS[locale];
  if (!target) throw new Error(`Locale inconnue: ${locale}`);

  const outPath = path.join(MESSAGES_DIR, `${locale}.json`);
  let existing = {};
  if (fs.existsSync(outPath)) {
    existing = JSON.parse(fs.readFileSync(outPath, "utf8"));
  }

  const mode = opts.force ? "complet (--force)" : "incrémental (nouvelles clés)";
  const sectionLabel = opts.onlySection ? ` · section "${opts.onlySection}"` : "";
  console.log(`\n→ ${locale} (${target.label}) · ${mode}${sectionLabel}`);

  const frSlice = pickSection(frData, opts.onlySection);
  const existingSlice = pickSection(existing, opts.onlySection);

  const stats = { kept: 0, translated: 0 };

  const mergedSlice = await mergeIncremental(
    frSlice,
    existingSlice,
    target.google,
    stats,
    "",
    opts
  );

  const merged = mergeSectionIntoFull(existing, opts.onlySection, mergedSlice);
  merged.meta = {
    locale,
    label: target.label,
  };

  console.log(`  · conservées : ${stats.kept} · traduites : ${stats.translated}`);

  if (opts.dryRun) {
    console.log(`  (dry-run) écrirait ${outPath}`);
    return;
  }

  if (stats.translated === 0) {
    console.log(`  ✓ rien à faire — ${outPath} déjà à jour`);
    return;
  }

  fs.writeFileSync(outPath, `${JSON.stringify(merged, null, 2)}\n`, "utf8");
  console.log(`  ✓ ${outPath}`);
}

async function main() {
  const opts = parseArgs();

  if (!fs.existsSync(FR_PATH)) {
    console.error(`Fichier source introuvable: ${FR_PATH}`);
    process.exit(1);
  }

  const frData = JSON.parse(fs.readFileSync(FR_PATH, "utf8"));
  const locales = opts.onlyLocale ? [opts.onlyLocale] : Object.keys(TARGETS);

  console.log(
    opts.force
      ? "Mode : retraduction complète"
      : "Mode : incrémental (seules les clés manquantes ou encore en français)"
  );

  for (const locale of locales) {
    if (!TARGETS[locale]) {
      console.error(`Locale non supportée: ${locale}`);
      process.exit(1);
    }
    try {
      await translateLocale(locale, frData, opts);
    } catch (err) {
      console.error(`\n✗ Erreur pour ${locale}:`, err instanceof Error ? err.message : err);
      process.exit(1);
    }
  }

  console.log("\nTerminé.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
