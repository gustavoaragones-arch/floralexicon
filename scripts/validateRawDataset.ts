/**
 * Validate FloraLexicon regional raw JSON under `data/staging/europe/`
 * before promoting to `data/raw/` and merging.
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const STAGING_EUROPE = path.join(ROOT, "data", "staging", "europe");

type RawPlant = {
  scientific_name?: unknown;
  country?: unknown;
  country_iso?: unknown;
  common_names?: unknown;
};

function validateFile(filePath: string): boolean {
  let raw: unknown;
  try {
    raw = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch (e) {
    console.error(`[INVALID] ${filePath} → invalid JSON:`, e);
    return false;
  }

  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    console.error(`[INVALID] ${filePath} → root must be an object`);
    return false;
  }

  const o = raw as { plants?: unknown };
  if (!Array.isArray(o.plants)) {
    console.error(`[INVALID] ${filePath} → missing plants array`);
    return false;
  }

  let valid = true;

  o.plants.forEach((p: unknown, i: number) => {
    if (!p || typeof p !== "object" || Array.isArray(p)) {
      console.error(`[${filePath}] invalid plant at index ${i}`);
      valid = false;
      return;
    }
    const row = p as RawPlant;
    if (typeof row.scientific_name !== "string" || !row.scientific_name.trim()) {
      console.error(`[${filePath}] missing scientific_name at index ${i}`);
      valid = false;
    }

    const countryOk =
      (typeof row.country === "string" && row.country.trim()) ||
      (typeof row.country_iso === "string" && row.country_iso.trim());
    if (!countryOk) {
      console.error(
        `[${filePath}] missing country / country_iso at index ${i}`
      );
      valid = false;
    }

    if (!Array.isArray(row.common_names) || row.common_names.length === 0) {
      console.error(`[${filePath}] invalid common_names at index ${i}`);
      valid = false;
    }
  });

  return valid;
}

function run(): void {
  if (!fs.existsSync(STAGING_EUROPE)) {
    console.error(`Missing directory: ${STAGING_EUROPE}`);
    process.exit(1);
  }

  const files = fs.readdirSync(STAGING_EUROPE).filter((f) => f.endsWith(".json"));

  if (files.length === 0) {
    console.log(`No .json files in ${STAGING_EUROPE} (nothing to validate).`);
    return;
  }

  let allValid = true;

  for (const file of files) {
    const full = path.join(STAGING_EUROPE, file);
    const ok = validateFile(full);
    if (!ok) allValid = false;
  }

  if (!allValid) {
    console.error("❌ Validation failed. Fix files before merging.");
    process.exit(1);
  }

  console.log(`✅ All ${files.length} file(s) valid`);
}

const entry = process.argv[1];
if (entry && path.resolve(entry) === path.resolve(fileURLToPath(import.meta.url))) {
  run();
}
