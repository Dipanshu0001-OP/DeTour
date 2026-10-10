import { describe, it, expect, vi } from 'vitest';
import {
  getRecommendations, filterPlaces, summarizeRejections, keywordSimilarities, rankBySimilarity, WEIGHTS,
} from '../utils/recommendations.js';
import {
  generateItinerary, addToItinerary, removeFromItinerary, assembleItinerary, DAY_END_MINUTE, DAY_START_MINUTE,
} from '../utils/itinerary.js';
import { optimizeBudget, calculateLocalImpact } from '../utils/budget.js';
import { InvalidPreferencesError, normalizePreferences } from '../utils/shared.js';
import { FIXTURE_PLACES as PLACES } from './fixtures.js';
import { mockEmbedder as embedder } from './mockEmbedder.js';

const base = {
  destination: 'Jaipur', ageGroup: '18-24', groupType: 'solo', groupSize: 1, budgetPerPerson: 1500,
  interests: ['culture', 'crafts'], diet: 'vegetarian', durationDays: 1, hiddenGemsOnly: false,
};
const ids = (list) => list.map((r) => r.id);
const byId = (id) => PLACES.find((p) => p.id === id);

describe('Scenario 1: low-budget solo vegetarian', () => {
  const prefs = { ...base, budgetPerPerson: 300, interests: ['crafts', 'food'] };

  it('respects diet, budget and group hard filters', async () => {
    const recs = await getRecommendations(prefs, PLACES, { embedder });
    expect(recs.length).toBeGreaterThan(0);
    expect(ids(recs)).not.toContain('nonveg-house');
    expect(ids(recs)).not.toContain('palace-dinner');
    expect(ids(recs)).not.toContain('kids-clay');
    expect(ids(recs)).not.toContain('udaipur-boat');
    for (const r of recs) if (r.pricePerPerson !== null) expect(r.pricePerPerson).toBeLessThanOrEqual(300);
  });

  it('is sorted by score and scores stay within 0-100', async () => {
    const recs = await getRecommendations(prefs, PLACES, { embedder });
    for (let i = 1; i < recs.length; i++) expect(recs[i - 1].score).toBeGreaterThanOrEqual(recs[i].score);
    for (const r of recs) {
      expect(r.score).toBeGreaterThanOrEqual(0);
      expect(r.score).toBeLessThanOrEqual(Object.values(WEIGHTS).reduce((a, b) => a + b, 0));
      expect(r.explanation.length).toBeGreaterThan(0);
      expect(r.matchMode).toBe('semantic');
    }
  });

  it('never treats an unknown price as free', async () => {
    const recs = await getRecommendations(prefs, PLACES, { embedder });
    const walk = recs.find((r) => r.id === 'heritage-walk');
    expect(walk.priceUnknown).toBe(true);
    expect(walk.components.budget).toBeLessThan(1);
    expect(walk.explanation.join(' ')).toMatch(/price not available/i);
    const free = recs.find((r) => r.id === 'temple');
    expect(free.priceUnknown).toBe(false);
    expect(free.components.budget).toBe(1);
  });
});

describe('Dietary filters', () => {
  it('vegan excludes vegetarian-only food but keeps non-food', async () => {
    const recs = await getRecommendations({ ...base, diet: 'vegan' }, PLACES, { embedder });
    expect(ids(recs)).toContain('snack-walk');
    expect(ids(recs)).not.toContain('veg-thali');
    expect(ids(recs)).toContain('block-print');
  });

  it('non-vegetarian travellers may receive all food', async () => {
    const recs = await getRecommendations({ ...base, diet: 'non-vegetarian' }, PLACES, { embedder });
    expect(ids(recs)).toContain('nonveg-house');
  });

  it('excludes food listings with no dietary tags when a diet is required', () => {
    const untagged = { ...byId('veg-thali'), id: 'x', dietaryTags: [] };
    const { passed, rejected } = filterPlaces(base, [untagged]);
    expect(passed).toHaveLength(0);
    expect(rejected[0].reason).toBe('diet');
  });
});

describe('Scenario 2: family trip', () => {
  const family = { ...base, groupType: 'family', groupSize: 4, budgetPerPerson: 3000, interests: ['crafts', 'learning'], diet: 'any' };

  it('respects group suitability and differs from the solo result', async () => {
    const famRecs = await getRecommendations(family, PLACES, { embedder });
    const soloRecs = await getRecommendations({ ...family, groupType: 'solo', groupSize: 1 }, PLACES, { embedder });
    expect(ids(famRecs)).toContain('kids-clay');
    expect(ids(famRecs)).not.toContain('trek');
    expect(ids(soloRecs)).not.toContain('kids-clay');
    expect(ids(famRecs)).not.toEqual(ids(soloRecs));
    expect(famRecs[0].explanation.join(' ')).toMatch(/family/i);
  });

  it('multiplies totals by group size', async () => {
    const recs = await getRecommendations(family, PLACES, { embedder });
    const itin = generateItinerary(family, recs);
    expect(itin.totalCost).toBeCloseTo(itin.totalCostPerPerson * 4, 5);
    expect(itin.budgetTotal).toBe(12000);
  });
});

describe('Scenario 3: empty result sets', () => {
  it('returns [] for no places, wrong destination or impossible filters', async () => {
    expect(await getRecommendations(base, [], { embedder })).toEqual([]);
    expect(await getRecommendations({ ...base, destination: 'Goa' }, PLACES, { embedder })).toEqual([]);
    expect(await getRecommendations({ ...base, hiddenGemsOnly: true, interests: ['food'], diet: 'vegan', groupType: 'family' }, [byId('veg-thali')], { embedder })).toEqual([]);
  });

  it('explains why via summarizeRejections', () => {
    const { passed, rejected } = filterPlaces({ ...base, destination: 'Goa' }, PLACES);
    expect(passed).toHaveLength(0);
    expect(summarizeRejections(rejected)).toEqual({ destination: PLACES.length });
  });

  it('produces an empty itinerary with a warning instead of throwing', () => {
    const itin = generateItinerary(base, []);
    expect(itin.items).toEqual([]);
    expect(itin.totalCost).toBe(0);
    expect(itin.withinBudget).toBe(true);
    expect(itin.warnings.join(' ')).toMatch(/no experiences/i);
  });
});

describe('Scenario 4: request exceeds the available budget', () => {
  it('only free or unpriced listings survive a ₹20 budget', async () => {
    const recs = await getRecommendations({ ...base, budgetPerPerson: 20, diet: 'any' }, PLACES, { embedder });
    for (const r of recs) expect(r.pricePerPerson === 0 || r.pricePerPerson === null).toBe(true);
  });

  it('itinerary never exceeds budget and leaves unpriced items out by default', async () => {
    const prefs = { ...base, budgetPerPerson: 20, diet: 'any' };
    const itin = generateItinerary(prefs, await getRecommendations(prefs, PLACES, { embedder }));
    expect(itin.totalCost).toBeLessThanOrEqual(20);
    expect(ids(itin.items)).not.toContain('heritage-walk');
    expect(itin.skipped.unpriced).toContain('heritage-walk');
  });

  it('budget of zero still works', async () => {
    const recs = await getRecommendations({ ...base, budgetPerPerson: 0, diet: 'any' }, PLACES, { embedder });
    for (const r of recs) expect(r.pricePerPerson === 0 || r.pricePerPerson === null).toBe(true);
  });
});

describe('Validation and fallback', () => {
  it('rejects invalid preferences with details', async () => {
    await expect(getRecommendations({ ...base, groupSize: 0 }, PLACES, { embedder })).rejects.toBeInstanceOf(InvalidPreferencesError);
    await expect(getRecommendations({ ...base, budgetPerPerson: 'lots' }, PLACES, { embedder })).rejects.toThrow(/budgetPerPerson/);
    await expect(getRecommendations({ ...base, diet: 'carnivore' }, PLACES, { embedder })).rejects.toThrow(/diet/);
    expect(() => normalizePreferences(null)).toThrow(InvalidPreferencesError);
  });

  it('falls back to keyword matching if the embedder fails, and says so', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const recs = await getRecommendations(base, PLACES, { embedder: async () => { throw new Error('model offline'); } });
    expect(recs.length).toBeGreaterThan(0);
    expect(recs.every((r) => r.matchMode === 'keyword-fallback')).toBe(true);
    expect(recs[0].semanticSimilarity).toBeNull();
    warn.mockRestore();
  });

  it('preferences change the ranking', async () => {
    const crafts = await getRecommendations({ ...base, interests: ['crafts'], diet: 'any' }, PLACES, { embedder });
    const history = await getRecommendations({ ...base, interests: ['history'], diet: 'any' }, PLACES, { embedder });
    expect(crafts[0].id).not.toBe(history[0].id);
  });

  it('hidden gem mode keeps only hidden-gem listings', async () => {
    const recs = await getRecommendations({ ...base, hiddenGemsOnly: true, diet: 'any' }, PLACES, { embedder });
    expect(ids(recs).sort()).toEqual(['lake-view', 'stepwell']);
  });
});

describe('Semantic vs keyword (plumbing check with MOCK embedder)', () => {
  it('finds a paraphrased request that keyword matching misses entirely', async () => {
    const keyword = await rankBySimilarity('stamping cloth patterns', PLACES, { mode: 'keyword' });
    expect(keyword[0].place.id).not.toBe('block-print');
    const semantic = await rankBySimilarity('stamping cloth patterns', PLACES, { mode: 'semantic', embedder });
    expect(['block-print', 'weave-coop']).toContain(semantic[0].place.id);
    expect(keywordSimilarities('stamping cloth patterns', [byId('block-print')])[0]).toBeLessThan(0.5);
  });

  it('uses the free-text query when provided', async () => {
    const recs = await getRecommendations({ ...base, interests: [], diet: 'any', query: 'peaceful spot away from tourist crowds' }, PLACES, { embedder });
    expect(['lake-view', 'stepwell']).toContain(recs[0].id);
  });
});

describe('Itinerary generation', () => {
  const prefs = { ...base };
  const build = async (p = prefs, opts) => generateItinerary(p, await getRecommendations(p, PLACES, { embedder }), opts);

  it('schedules chronologically with no overlaps, inside the day window', async () => {
    const itin = await build();
    expect(itin.items.length).toBeGreaterThan(1);
    const items = itin.days[0].items;
    for (let i = 0; i < items.length; i++) {
      expect(items[i].startMinute).toBeGreaterThanOrEqual(DAY_START_MINUTE);
      expect(items[i].endMinute).toBeLessThanOrEqual(DAY_END_MINUTE);
      if (i > 0) expect(items[i].startMinute).toBeGreaterThanOrEqual(items[i - 1].endMinute);
    }
  });

  it('totals match the sum of listed prices and stay within budget', async () => {
    const itin = await build();
    const sum = itin.items.reduce((s, i) => s + i.pricePerPerson, 0);
    expect(itin.totalCostPerPerson).toBe(sum);
    expect(itin.remainingBudget).toBe(1500 - sum);
    expect(itin.withinBudget).toBe(true);
  });

  it('includes at most 2 meals per day and spreads multi-day trips', async () => {
    const p = { ...base, durationDays: 2, budgetPerPerson: 5000, diet: 'any', interests: ['food', 'culture', 'crafts', 'history'] };
    const itin = await build(p);
    for (const day of itin.days) expect(day.items.filter((i) => i.category === 'food').length).toBeLessThanOrEqual(2);
    expect(itin.days[0].items.length).toBeGreaterThan(0);
    expect(itin.days[1].items.length).toBeGreaterThan(0);
    expect(new Set(ids(itin.items)).size).toBe(itin.items.length);
  });

  it('can include unpriced items without counting them as free', async () => {
    const itin = await build({ ...base, budgetPerPerson: 2000, diet: 'any', durationDays: 3 }, { includeUnpriced: true });
    expect(ids(itin.items)).toContain('heritage-walk');
    expect(itin.unpricedItemIds).toContain('heritage-walk');
    expect(itin.warnings.join(' ')).toMatch(/unknown/i);
    expect(itin.totalCostPerPerson).toBe(itin.items.filter((i) => i.pricePerPerson !== null).reduce((s, i) => s + i.pricePerPerson, 0));
  });

  it('add / remove recompute totals and warn when over budget', async () => {
    const itin = await build({ ...base, budgetPerPerson: 400, diet: 'any' });
    const before = itin.totalCostPerPerson;
    const added = addToItinerary(itin, byId('palace-dinner'));
    if (added.added) {
      expect(added.itinerary.totalCostPerPerson).toBe(before + 4500);
      expect(added.itinerary.withinBudget).toBe(false);
      expect(added.itinerary.warnings.join(' ')).toMatch(/over budget/i);
    }
    expect(addToItinerary(itin, itin.items[0]).reason).toBe('already-in-itinerary');
    const removed = removeFromItinerary(itin, itin.items[0].id);
    expect(removed.items.length).toBe(itin.items.length - 1);
  });
});

describe('Budget Rescue (optimizeBudget)', () => {
  const prefs = normalizePreferences({ ...base, budgetPerPerson: 600, diet: 'any' });
  const alternatives = async (p) => getRecommendations(p, PLACES, { embedder });

  it('swaps an expensive item for a cheaper compatible one and recalculates savings', async () => {
    const itin = assembleItinerary(prefs, [[byId('fort'), byId('block-print')]]);
    expect(itin.totalCost).toBe(900);
    expect(itin.withinBudget).toBe(false);

    const result = optimizeBudget(itin, await alternatives(prefs), 600);
    expect(result.changed).toBe(true);
    expect(result.swaps[0].removed.id).toBe('fort');
    expect(result.swaps[0].added.id).toBe('stepwell');
    expect(result.savingsTotal).toBe(450);
    expect(result.newTotalCost).toBe(450);
    expect(result.previousTotalCost).toBe(900);
    expect(result.withinBudget).toBe(true);
    expect(itin.totalCost).toBe(900);
  });

  it('scales savings and budget by group size', async () => {
    const p = normalizePreferences({ ...prefs, groupSize: 3 });
    const itin = assembleItinerary(p, [[byId('fort'), byId('block-print')]]);
    const result = optimizeBudget(itin, await alternatives(p), 1800);
    expect(result.previousTotalCost).toBe(2700);
    expect(result.savingsTotal).toBe(1350);
    expect(result.savingsPerPerson).toBe(450);
    expect(result.withinBudget).toBe(true);
  });

  it('does not swap in incompatible alternatives (diet / group)', async () => {
    const p = normalizePreferences({ ...base, budgetPerPerson: 1000, diet: 'vegetarian' });
    const itin = assembleItinerary(p, [[byId('veg-thali'), byId('palace-dinner')]]);
    const result = optimizeBudget(itin, PLACES, 1000);
    const added = result.swaps.map((s) => s.added.id);
    expect(added).not.toContain('nonveg-house');
    expect(added).toContain('snack-walk');
    expect(result.swaps[0].removed.id).toBe('palace-dinner');
  });

  it('reports honestly when no compatible alternative exists', async () => {
    const p = normalizePreferences({ ...base, budgetPerPerson: 100, diet: 'any' });
    const itin = assembleItinerary(p, [[byId('trek')]]);
    const result = optimizeBudget(itin, [byId('kids-clay'), byId('nonveg-house')], 100);
    expect(result.changed).toBe(false);
    expect(result.withinBudget).toBe(false);
    expect(result.message).toMatch(/no cheaper compatible/i);
  });

  it('leaves a within-budget itinerary alone unless forced', async () => {
    const p = normalizePreferences({ ...base, budgetPerPerson: 2000, diet: 'any' });
    const itin = assembleItinerary(p, [[byId('fort'), byId('block-print')]]);
    const alts = await alternatives(p);
    expect(optimizeBudget(itin, alts, 2000).changed).toBe(false);
    const forced = optimizeBudget(itin, alts, 2000, { force: true });
    expect(forced.changed).toBe(true);
    expect(forced.savingsTotal).toBe(forced.previousTotalCost - forced.newTotalCost);
    expect(forced.savingsTotal).toBeGreaterThan(0);
  });
});

describe('Local Impact Meter', () => {
  const p = normalizePreferences({ ...base, groupSize: 2, diet: 'any' });

  it('counts only priced community-run items and reports the rest separately', () => {
    const unpricedCommunity = { ...byId('block-print'), id: 'u', pricePerPerson: null };
    const itin = assembleItinerary(p, [[byId('block-print'), byId('weave-coop'), byId('fort'), unpricedCommunity]]);
    const impact = calculateLocalImpact(itin, { savings: 120 });
    expect(impact.communitySpend).toBe((400 + 200) * 2);
    expect(impact.verifiedCommunitySpend).toBe(200 * 2);
    expect(impact.unverifiedCommunitySpend).toBe(400 * 2);
    expect(impact.totalSpend).toBe((400 + 200 + 500) * 2);
    expect(impact.sharePercent).toBe(54.5);
    expect(impact.unpricedCommunityItemCount).toBe(1);
    expect(impact.estimatedSavings).toBe(120);
    expect(impact.disclaimer).toMatch(/not a measure of donations/i);
  });

  it('handles itineraries with no community providers', () => {
    const impact = calculateLocalImpact(assembleItinerary(p, [[byId('fort')]]));
    expect(impact.communitySpend).toBe(0);
    expect(impact.sharePercent).toBe(0);
    expect(calculateLocalImpact(null).totalSpend).toBe(0);
  });
});