#!/usr/bin/env node
const fs = require("fs");
const canon = JSON.parse(fs.readFileSync("data/canonical/plants.json", "utf8"));
const canonIds = new Set(canon.plants.map(p => p.plant_id));
const tier1 = fs.readdirSync("data/tier1").filter(f => f.endsWith(".json")).map(f => f.replace(".json", ""));
const t1 = new Set(tier1);
const missingFile = [...canonIds].filter(id => !t1.has(id));
const missingCanon = tier1.filter(id => !canonIds.has(id));
const bad = missingFile.length + missingCanon.length + (canonIds.size === tier1.length ? 0 : 1);
console.log("canonical:", canonIds.size, "| tier1 files:", tier1.length);
console.log("in canonical, missing tier1 file:", missingFile);
console.log("tier1 file, not in canonical:", missingCanon);
console.log(bad ? "\nOUT OF SYNC" : "\nin sync");
process.exit(bad ? 1 : 0);
