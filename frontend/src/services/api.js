import { getRecommendations } from '../utils/recommendations.js';
import { PLACES } from '../data/demoPlaces.js';

const API = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

export const getAllPlaces = () => PLACES;

function normalizeRecommendation(place) {
  const score = Number.isFinite(place?.matchScore)
    ? place.matchScore
    : Number.isFinite(place?.score)
      ? place.score / 100
      : 0;
  const reasons = Array.isArray(place?.reasons)
    ? place.reasons
    : Array.isArray(place?.explanation)
      ? place.explanation
      : [];
  return {
    ...place,
    matchScore: Math.max(0, Math.min(1, score)),
    reasons,
  };
}

export async function fetchRecommendations(prefs) {
  if (API) {
    try {
      const response = await fetch(`${API}/recommendations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prefs),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || `API returned ${response.status}`);
      }
      const recommendations = Array.isArray(payload)
        ? payload
        : payload.recommendations;
      if (!Array.isArray(recommendations)) {
        throw new Error('API response did not contain a recommendations array');
      }
      return {
        items: recommendations.map(normalizeRecommendation),
        source: 'aws',
        meta: payload.meta ?? null,
      };
    } catch (error) {
      console.warn('DeTour API failed, using local engine:', error.message);
    }
  }
  const local = await getRecommendations(prefs, PLACES);
  return { items: local.map(normalizeRecommendation), source: 'local', meta: null };
}
