/**
 * Name–country coverage audit: raw regional JSON vs indexed names file.
 * Writes data/audit/name-coverage-report.json and prints a console summary.
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "node:url";
import {
  auditNameCoverage,
  countRawNormalizedHubs,
} from "../lib/dataAudit";

const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "data", "audit");
const OUT_FILE = path.join(OUT_DIR, "name-coverage-report.json");

function main() {
  const indexedArg = process.argv[2];
  const indexedPath =
    indexedArg && indexedArg.startsWith("-")
      ? undefined
      : indexedArg;

  const rawHubs = countRawNormalizedHubs();
  const report = auditNameCoverage(indexedPath);

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(report, null, 2) + "\n", "utf8");

  console.log(`Raw normalized name hubs: ${rawHubs}`);
  console.log(`Indexed file: ${indexedPath ?? "(default)"}`);
  console.log(`Names with missing country coverage vs raw: ${report.length}`);
  console.log("Top 20 by missing country count:");
  for (const row of report.slice(0, 20)) {
    console.log(
      `  ${row.normalized}: missing [${row.missingCountries.join(", ")}] (raw: [${row.rawCountries.join(", ")}], indexed: [${row.indexedCountries.join(", ")}])`
    );
  }
  console.log(`Wrote: ${OUT_FILE}`);

  if (report.length > 0) {
    console.error(
      `\nFAIL: ${report.length} name hub(s) still lack full raw country coverage in the indexed file.`
    );
    process.exit(1);
  }
}

const entry = process.argv[1];
if (entry && path.resolve(entry) === path.resolve(fileURLToPath(import.meta.url))) {
  main();
}
