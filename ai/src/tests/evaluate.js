import { rankBySimilarity, MODEL_ID } from '../utils/recommendations.js';
import { FIXTURE_PLACES } from './fixtures.js';
import { mockEmbedder } from './mockEmbedder.js';

const QUERIES = [
  { q: 'textile stamping with natural dyes', relevant: ['block-print'] },
  { q: 'make something with clay using my hands', relevant: ['pottery', 'kids-clay'] },
  { q: 'peaceful spot away from tourist crowds', relevant: ['lake-view', 'stepwell'] },
  { q: 'somewhere to eat without meat', relevant: ['veg-thali', 'snack-walk'] },
  { q: 'traditional shows after dark', relevant: ['puppet'] },
  { q: 'climb a hill at dawn', relevant: ['trek'] },
  { q: 'royal architecture and old stories', relevant: ['fort', 'heritage-walk'] },
  { q: 'learn how artisans weave cloth', relevant: ['weave-coop'] },
];

const useMock = process.argv.includes('--mock');
const places = FIXTURE_PLACES.filter((p) => p.city === 'Jaipur');
const embedder = useMock ? mockEmbedder : undefined;

function metrics(ranked, relevant) {
  const ids = ranked.map((r) => r.place.id);
  const top3 = ids.slice(0, 3);
  const p3 = top3.filter((id) => relevant.includes(id)).length / 3;
  const firstRel = ids.findIndex((id) => relevant.includes(id));
  return { p3, rr: firstRel === -1 ? 0 : 1 / (firstRel + 1), top1: ids[0] };
}

const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
const fmt = (n) => n.toFixed(2);

console.log(useMock ? 'Embedder: MOCK (plumbing check only)' : `Embedder: ${MODEL_ID} (real model)`);
console.log(`Listings: ${places.length} | Queries: ${QUERIES.length}\n`);

const rows = [];
for (const { q, relevant } of QUERIES) {
  const kw = metrics(await rankBySimilarity(q, places, { mode: 'keyword' }), relevant);
  const sem = metrics(await rankBySimilarity(q, places, { mode: 'semantic', embedder }), relevant);
  rows.push({ q, kw, sem });
  console.log(`"${q}"\n   keyword  top1=${kw.top1.padEnd(14)} P@3=${fmt(kw.p3)} RR=${fmt(kw.rr)}\n   semantic top1=${sem.top1.padEnd(14)} P@3=${fmt(sem.p3)} RR=${fmt(sem.rr)}`);
}

console.log('\n=== Summary ===');
console.log(`Keyword  : P@3=${fmt(mean(rows.map((r) => r.kw.p3)))}  MRR=${fmt(mean(rows.map((r) => r.kw.rr)))}`);
console.log(`Semantic : P@3=${fmt(mean(rows.map((r) => r.sem.p3)))}  MRR=${fmt(mean(rows.map((r) => r.sem.rr)))}`);
if (useMock) console.log('\nNOTE: mock embedder results prove the pipeline runs; they are NOT evidence of model quality.');