const CLUSTERS = [
  ['craft', 'workshop', 'artisan', 'handmade', 'hands', 'hand', 'stamp', 'stamping', 'block', 'printing', 'textile', 'fabric', 'dye', 'dyes', 'make', 'making', 'made', 'something'],
  ['pottery', 'clay', 'ceramic', 'modelling', 'shape', 'studio', 'blue'],
  ['weave', 'weaving', 'weaver', 'loom', 'cloth', 'handloom', 'cooperative'],
  ['quiet', 'peaceful', 'calm', 'crowd', 'crowds', 'secluded', 'rarely', 'tourist', 'hidden', 'lesser', 'offbeat', 'lake', 'lakeside'],
  ['history', 'historic', 'royal', 'fort', 'palace', 'heritage', 'architecture', 'old', 'stories', 'haveli'],
  ['food', 'eat', 'meat', 'vegetarian', 'thali', 'snack', 'street', 'taste', 'restaurant', 'meal', 'dish'],
  ['show', 'performance', 'puppet', 'puppetry', 'folk', 'music', 'dark', 'evening', 'traditional'],
  ['hike', 'hiking', 'trek', 'trail', 'climb', 'hill', 'hilltop', 'sunrise', 'dawn', 'aravalli', 'adventure'],
  ['kid', 'child', 'children', 'play', 'playful', 'parent'],
];
const INDEX = new Map();
CLUSTERS.forEach((words, i) => words.forEach((w) => INDEX.set(w, i)));

const stem = (t) => (t.length > 3 && t.endsWith('s') ? t.slice(0, -1) : t);

export async function mockEmbedder(texts) {
  return texts.map((text) => {
    const v = new Array(CLUSTERS.length).fill(0);
    for (const raw of String(text).toLowerCase().split(/[^a-z0-9]+/)) {
      const idx = INDEX.get(raw) ?? INDEX.get(stem(raw));
      if (idx !== undefined) v[idx] += 1;
    }
    const norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0)) || 1;
    return v.map((x) => x / norm);
  });
}