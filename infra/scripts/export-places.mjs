import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const sourcePath = path.resolve(here, '../../frontend/src/data/demoPlaces.js');
const outputPath = path.resolve(here, '../data/places.json');
const { PLACES } = await import(pathToFileURL(sourcePath).href);
if (!Array.isArray(PLACES) || PLACES.length < 1) throw new Error('PLACES export is empty or invalid.');
const ids = new Set(PLACES.map((place) => place.id));
if (ids.size !== PLACES.length) throw new Error('PLACES contains duplicate IDs.');
fs.writeFileSync(outputPath, `${JSON.stringify(PLACES, null, 2)}\n`, 'utf8');
console.log(`Exported ${PLACES.length} DeTour demo listings to infra/data/places.json.`);
