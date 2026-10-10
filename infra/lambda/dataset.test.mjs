import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const places = JSON.parse(fs.readFileSync(path.resolve(here, '../data/places.json'), 'utf8'));

test('DeTour seed dataset has 25-40 unique listings across supported demo cities', () => {
  assert.ok(places.length >= 25 && places.length <= 40, `expected 25-40 listings, got ${places.length}`);
  assert.equal(new Set(places.map((place) => place.id)).size, places.length);
  assert.deepEqual([...new Set(places.map((place) => place.city))].sort(), ['Dehradun', 'Mussoorie', 'Nainital', 'Rishikesh']);
});

test('demo listings never claim verified providers and keep estimates labelled', () => {
  assert.ok(places.every((place) => place.dataSource === 'demo'));
  assert.ok(places.every((place) => place.priceIsEstimate === true));
  assert.ok(places.every((place) => place.community?.verified !== true));
  assert.ok(places.every((place) => place.pricePerPerson === null || (Number.isFinite(place.pricePerPerson) && place.pricePerPerson >= 0)));
});

test('unknown prices are null and never carry a free-price tag', () => {
  const unknown = places.filter((place) => place.pricePerPerson === null);
  assert.ok(unknown.length >= 5);
  assert.ok(unknown.every((place) => !(place.tags ?? []).includes('free')));
});
