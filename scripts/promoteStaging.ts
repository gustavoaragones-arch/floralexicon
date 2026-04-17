/**
 * Move validated JSON from `data/staging/europe/` → `data/raw/`.
 * Run `npm run validate-raw` first.
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FROM = path.join(ROOT, "data", "staging", "europe");
const TO = path.join(ROOT, "data", "raw");

function main(): void {
  if (!fs.existsSync(FROM)) {
    console.error(`Missing directory: ${FROM}`);
    process.exit(1);
  }

  fs.mkdirSync(TO, { recursive: true });

  const files = fs.readdirSync(FROM).filter((f) => f.endsWith(".json"));

  if (files.length === 0) {
    console.log(`No .json files in ${FROM} (nothing to promote).`);
    return;
  }

  for (const file of files) {
    const src = path.join(FROM, file);
    const dest = path.join(TO, file);
    if (fs.existsSync(dest)) {
      console.error(
        `Refusing to overwrite existing file: ${dest}\nRemove or rename it first, or merge the current raw copy.`
      );
      process.exit(1);
    }
    fs.renameSync(src, dest);
    console.log(`Moved: ${file}`);
  }

  console.log(`✅ Promoted ${files.length} file(s) → data/raw`);
}

const entry = process.argv[1];
if (entry && path.resolve(entry) === path.resolve(fileURLToPath(import.meta.url))) {
  main();
}
