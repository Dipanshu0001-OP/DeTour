import { getRecommendations } from './ai/index.js';

/**
 * Run the DeTour AI ranking flow in a Lambda-friendly mode.
 * The keyword path uses the same AI team's validation, hard filters, scoring,
 * explanations, and budget handling without downloading a large model on cold start.
 */
export async function rankPlaces(preferences, places) {
  const results = await getRecommendations(preferences, places, { useSemantic: false });
  return results.map((place) => ({
    ...place,
    // Compatibility fields expected by the existing React frontend.
    matchScore: Math.max(0, Math.min(1, Number(place.score ?? 0) / 100)),
    reasons: Array.isArray(place.explanation) ? place.explanation : [],
  }));
}

export function canonicalCity(input) {
  const normalized = String(input ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
  const supported = {
    dehradun: 'Dehradun',
    mussoorie: 'Mussoorie',
    rishikesh: 'Rishikesh',
    nainital: 'Nainital',
  };
  if (supported[normalized]) return supported[normalized];
  return normalized.replace(/\b\w/g, (char) => char.toUpperCase());
}

export function compatibleRecommendationPayload(results, candidateCount) {
  return {
    recommendations: results,
    meta: {
      app: 'DeTour',
      engine: 'DeTour AI recommendation engine',
      mode: 'keyword-fallback',
      candidateCount,
      returnedCount: results.length,
      note: 'Demo listings and prices are illustrative estimates; confirm details locally.',
    },
  };
}
