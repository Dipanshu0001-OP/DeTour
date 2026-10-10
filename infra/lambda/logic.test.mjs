import test from 'node:test';
import assert from 'node:assert/strict';
import { rankPlaces, canonicalCity, compatibleRecommendationPayload } from './logic.mjs';

const places = [
  { id: 'trail', city: 'Dehradun', name: 'Forest trail', description: 'Quiet nature walk in the forest', category: 'attraction', pricePerPerson: 50, durationMinutes: 60, interests: ['nature', 'photography'], tags: ['hidden-gem'], groupTypes: ['solo', 'friends', 'couple', 'family'], dietaryTags: [], dataSource: 'demo', priceIsEstimate: true, community: { isCommunityRun: false, verified: false } },
  { id: 'meal', city: 'Dehradun', name: 'Vegetarian thali', description: 'Local vegetarian lunch', category: 'food', pricePerPerson: 200, durationMinutes: 45, interests: ['food', 'culture'], tags: [], groupTypes: ['solo', 'friends', 'couple', 'family'], dietaryTags: ['vegetarian'], dataSource: 'demo', priceIsEstimate: true, community: { isCommunityRun: true, verified: false, providerType: 'food-maker' } },
  { id: 'meat', city: 'Dehradun', name: 'Meat house', description: 'Local non-vegetarian dinner', category: 'food', pricePerPerson: 500, durationMinutes: 60, interests: ['food'], tags: [], groupTypes: ['solo', 'friends', 'couple', 'family'], dietaryTags: ['non-vegetarian'], dataSource: 'demo', priceIsEstimate: true, community: { isCommunityRun: false, verified: false } },
  { id: 'unknown', city: 'Dehradun', name: 'Old lane walk', description: 'Heritage walk by local lanes', category: 'attraction', pricePerPerson: null, durationMinutes: 60, interests: ['culture', 'history'], tags: [], groupTypes: ['solo', 'friends', 'couple', 'family'], dietaryTags: [], dataSource: 'demo', priceIsEstimate: true, community: { isCommunityRun: false, verified: false } },
];

test('maps city names without changing supported spellings', () => {
  assert.equal(canonicalCity(' dehradun '), 'Dehradun');
  assert.equal(canonicalCity('MUSSOORIE'), 'Mussoorie');
});

test('DeTour AI recommendation mode respects diet, budget and hidden gems', async () => {
  const results = await rankPlaces({ destination: 'Dehradun', budgetPerPerson: 250, groupType: 'solo', groupSize: 1, diet: 'vegetarian', interests: ['nature', 'food'], durationDays: 1, hiddenGemsOnly: false, query: 'quiet nature trail' }, places);
  const ids = results.map((place) => place.id);
  assert.ok(ids.includes('trail'));
  assert.ok(ids.includes('meal'));
  assert.ok(!ids.includes('meat'));
  assert.ok(ids.includes('unknown')); // Unknown prices remain visible, but are never treated as free.
  for (const place of results) {
    assert.ok(place.matchScore >= 0 && place.matchScore <= 1);
    assert.ok(Array.isArray(place.reasons));
  }
  assert.ok(results.every((p) => p.matchMode === 'keyword-fallback'));
});

test('unknown price remains unknown and budget metadata stays honest', async () => {
  const results = await rankPlaces({ destination: 'Dehradun', budgetPerPerson: 100, groupType: 'solo', groupSize: 1, diet: 'any', interests: ['culture'], durationDays: 1, hiddenGemsOnly: false }, places);
  const unknown = results.find((place) => place.id === 'unknown');
  assert.ok(unknown);
  assert.equal(unknown.priceUnknown, true);
  assert.ok(unknown.reasons.some((reason) => /price not available/i.test(reason)));
});

test('payload exposes frontend-compatible recommendations and mode metadata', () => {
  const payload = compatibleRecommendationPayload([{ id: 'x', matchScore: 0.7, reasons: ['demo'] }], 3);
  assert.equal(payload.recommendations[0].matchScore, 0.7);
  assert.equal(payload.meta.app, 'DeTour');
  assert.equal(payload.meta.candidateCount, 3);
});
