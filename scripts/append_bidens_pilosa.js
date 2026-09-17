// scripts/append_bidens_pilosa.js
// One-off append for a new plant_id, per the standard pattern.
const fs = require('fs');
const path = 'data/canonical/plants.json';

const newPlants = [
  {
    plant_id: 'bidens_pilosa',
    scientific_name: 'Bidens pilosa',
    family: 'Asteraceae',
    kingdom: 'Plantae',
    common_name_en: 'Beggar-ticks / Spanish needle',
    synonyms: ['Bidens alba', 'Bidens odorata', 'Bidens leucantha'],
  },
];

const data = JSON.parse(fs.readFileSync(path, 'utf8'));
const existingIds = new Set(data.plants.map((p) => p.plant_id));

let added = 0;
for (const p of newPlants) {
  if (existingIds.has(p.plant_id)) {
    console.log(`SKIP (already exists): ${p.plant_id}`);
    continue;
  }
  data.plants.push(p);
  added++;
  console.log(`ADDED: ${p.plant_id}`);
}

fs.writeFileSync(path, JSON.stringify(data, null, 2) + '\n');
console.log(`Done. ${added} plant(s) added. Total now: ${data.plants.length}`);
