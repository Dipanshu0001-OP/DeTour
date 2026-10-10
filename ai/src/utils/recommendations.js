import {
  clamp01, formatINR, getRejectionReason, groupCompatible, isPriceKnown,
  normalizeInterest, normalizePreferences, round2, HIDDEN_GEM_TAG,
} from './shared.js';

export const MODEL_ID = 'Xenova/all-MiniLM-L6-v2';
export const WEIGHTS = Object.freeze({ interest: 35, budget: 25, group: 15, community: 15, trend: 10 });

export const SIMILARITY_FLOOR = 0.1;
export const SIMILARITY_CEIL = 0.6;
export const SEMANTIC_SHARE = 0.6;
const UNKNOWN_PRICE_BUDGET_SCORE = 0.3;

const STOPWORDS = new Set((
  'a an the and or of to in on at for with without my me i we our is are be am want like love looking ' +
  'something somewhere some place places thing things do try trip travel traveller traveler experience ' +
  'experiences near around from by it its this that interested'
).split(' '));

export function tokenize(text) {
  return String(text ?? '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t && !STOPWORDS.has(t))
    .map((t) => (t.length > 3 && t.endsWith('s') ? t.slice(0, -1) : t));
}

export function placeText(place) {
  const parts = [
    place.name, place.description, place.category,
    (place.interests ?? []).join(' '),
    (place.tags ?? []).join(' '),
    place.community?.isCommunityRun ? `community-run ${place.community.providerType ?? ''}` : '',
  ];
  return parts.filter(Boolean).join('. ');
}

export function keywordSimilarity(query, text) {
  const q = [...new Set(tokenize(query))];
  if (q.length === 0) return 0;
  const doc = new Set(tokenize(text));
  return q.filter((t) => doc.has(t)).length / q.length;
}

export const keywordSimilarities = (query, places) =>
  places.map((p) => keywordSimilarity(query, placeText(p)));

let defaultEmbedderPromise = null;

export function getDefaultEmbedder(onProgress) {
  if (!defaultEmbedderPromise) {
    defaultEmbedderPromise = (async () => {
      const { pipeline } = await import('@huggingface/transformers');
      const extractor = await pipeline('feature-extraction', MODEL_ID, {
        dtype: 'q8',
        progress_callback: onProgress,
      });
      return async (texts) => {
        const output = await extractor(texts, { pooling: 'mean', normalize: true });
        return output.tolist();
      };
    })().catch((err) => {
      defaultEmbedderPromise = null;
      throw err;
    });
  }
  return defaultEmbedderPromise;
}

export const preloadModel = (onProgress) => getDefaultEmbedder(onProgress);

export function cosine(a, b) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return na === 0 || nb === 0 ? 0 : dot / Math.sqrt(na * nb);
}

const vectorCaches = new WeakMap();

export async function semanticSimilarities(query, places, embedder) {
  if (!vectorCaches.has(embedder)) vectorCaches.set(embedder, new Map());
  const cache = vectorCaches.get(embedder);

  const texts = places.map(placeText);
  const missing = [...new Set(texts.filter((t) => !cache.has(t)))];
  const vectors = await embedder([query, ...missing]);
  if (!Array.isArray(vectors) || vectors.length !== missing.length + 1) {
    throw new Error('Embedder returned an unexpected number of vectors');
  }
  const [queryVector, ...rest] = vectors;
  missing.forEach((t, i) => cache.set(t, rest[i]));
  return texts.map((t) => cosine(queryVector, cache.get(t)));
}

function withTimeout(promise, ms, label) {
  if (!ms) return promise;
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

export async function rankBySimilarity(query, places, { mode = 'semantic', embedder } = {}) {
  const sims = mode === 'keyword'
    ? keywordSimilarities(query, places)
    : await semanticSimilarities(query, places, embedder ?? (await getDefaultEmbedder()));
  return places
    .map((place, i) => ({ place, similarity: sims[i] }))
    .sort((a, b) => b.similarity - a.similarity);
}

export function filterPlaces(preferences, places) {
  const prefs = normalizePreferences(preferences);
  const passed = [];
  const rejected = [];
  for (const place of places) {
    const reason = getRejectionReason(prefs, place);
    if (reason) rejected.push({ place, reason });
    else passed.push(place);
  }
  return { passed, rejected };
}

export function summarizeRejections(rejected) {
  return rejected.reduce((acc, r) => ({ ...acc, [r.reason]: (acc[r.reason] ?? 0) + 1 }), {});
}

export function buildQuery(prefs) {
  const parts = [];
  if (prefs.query) parts.push(prefs.query);
  if (prefs.interests.length) parts.push(`I am interested in ${prefs.interests.join(', ')}`);
  if (prefs.hiddenGemsOnly) parts.push('lesser-known hidden gems away from the crowds');
  return parts.length ? parts.join('. ') : `things to do in ${prefs.destination}`;
}

function interestOverlap(prefs, place, fallback) {
  if (prefs.interests.length === 0) return fallback;
  const placeInterests = new Set([
    ...(place.interests ?? []).map(normalizeInterest),
    normalizeInterest(place.category),
  ]);
  const shared = prefs.interests.filter((i) => placeInterests.has(i));
  return shared.length / prefs.interests.length;
}

function budgetScore(prefs, place) {
  if (!isPriceKnown(place)) return UNKNOWN_PRICE_BUDGET_SCORE;
  if (prefs.budgetPerPerson === 0) return place.pricePerPerson === 0 ? 1 : 0;
  return clamp01(1 - place.pricePerPerson / prefs.budgetPerPerson);
}

const groupScore = (prefs, place) => {
  const compatible = groupCompatible(place, prefs.groupType);
  return compatible === null ? 0.5 : compatible ? 1 : 0;
};

const communityScore = (place) =>
  place.community?.isCommunityRun ? (place.community.verified ? 1 : 0.7) : 0;

function trendScore(place) {
  if (!place.trendDate || !Number.isFinite(place.trendScore) || place.trendScore <= 0) return 0;
  return clamp01(place.trendScore > 1 ? place.trendScore / 100 : place.trendScore);
}

const listJoin = (arr) =>
  arr.length <= 1 ? arr.join('') : `${arr.slice(0, -1).join(', ')} and ${arr[arr.length - 1]}`;

function buildExplanation(prefs, place, c, mode) {
  const out = [];
  const placeInterests = new Set((place.interests ?? []).map(normalizeInterest));
  const shared = prefs.interests.filter((i) => placeInterests.has(i) || i === normalizeInterest(place.category));
  if (shared.length) out.push(`Matches your interest in ${listJoin(shared)}.`);
  if (c.similarity >= 0.6) {
    out.push(mode === 'semantic'
      ? 'Closely matches the meaning of your request.'
      : 'Shares keywords with your request.');
  }
  if (isPriceKnown(place)) {
    if (place.pricePerPerson === 0) out.push('Free to visit.');
    else {
      const pct = prefs.budgetPerPerson > 0 ? Math.round((place.pricePerPerson / prefs.budgetPerPerson) * 100) : null;
      out.push(`${formatINR(place.pricePerPerson)} per person${place.priceIsEstimate ? ' (estimate)' : ''}${pct !== null ? `, about ${pct}% of your budget` : ''}.`);
    }
  } else {
    out.push('Price not available - confirm before you go.');
  }
  if (groupCompatible(place, prefs.groupType)) out.push(`Suitable for ${prefs.groupType} travellers.`);
  if (place.community?.isCommunityRun) {
    out.push(place.community.verified ? 'Community-run provider (verified).' : 'Community-run provider (not yet verified).');
  }
  if ((place.tags ?? []).includes(HIDDEN_GEM_TAG)) out.push('A lesser-known hidden gem.');
  if (c.trend > 0) out.push(`Trending: ${place.trendLabel ?? 'recent interest'} (as of ${place.trendDate}).`);
  if (place.dataSource === 'demo') out.push('Demo listing - details are illustrative.');
  return out;
}

export async function getRecommendations(preferences, places, options = {}) {
  const prefs = normalizePreferences(preferences);
  if (!Array.isArray(places)) throw new TypeError('places must be an array');

  const { passed } = filterPlaces(prefs, places);
  if (passed.length === 0) return [];

  const query = buildQuery(prefs);
  let similarities;
  let matchMode;
  let rawCosines = null;

  try {
    if (options.useSemantic === false) throw new Error('semantic matching disabled');
    const embedder = options.embedder ?? await withTimeout(
      getDefaultEmbedder(options.onProgress), options.modelTimeoutMs ?? 20000, 'Model load');
    rawCosines = await semanticSimilarities(query, passed, embedder);
    similarities = rawCosines.map((cos) =>
      clamp01((cos - SIMILARITY_FLOOR) / (SIMILARITY_CEIL - SIMILARITY_FLOOR)));
    matchMode = 'semantic';
  } catch (err) {
    if (options.useSemantic !== false) {
      console.warn('[DeTour] Semantic matching unavailable, using keyword fallback:', err.message);
    }
    similarities = keywordSimilarities(query, passed);
    matchMode = 'keyword-fallback';
  }

  const results = passed.map((place, i) => {
    const similarity = similarities[i];
    const overlap = interestOverlap(prefs, place, similarity);
    const components = {
      interest: SEMANTIC_SHARE * similarity + (1 - SEMANTIC_SHARE) * overlap,
      budget: budgetScore(prefs, place),
      group: groupScore(prefs, place),
      community: communityScore(place),
      trend: trendScore(place),
      similarity,
    };
    const score =
      WEIGHTS.interest * components.interest + WEIGHTS.budget * components.budget +
      WEIGHTS.group * components.group + WEIGHTS.community * components.community +
      WEIGHTS.trend * components.trend;

    return {
      ...place,
      score: round2(score),
      components: Object.fromEntries(Object.entries(components).map(([k, v]) => [k, round2(v)])),
      semanticSimilarity: rawCosines ? round2(rawCosines[i]) : null,
      matchMode,
      priceUnknown: !isPriceKnown(place),
      explanation: buildExplanation(prefs, place, components, matchMode),
    };
  });

  return results.sort((a, b) =>
    b.score - a.score ||
    (a.pricePerPerson ?? Infinity) - (b.pricePerPerson ?? Infinity) ||
    String(a.name).localeCompare(String(b.name)));
}