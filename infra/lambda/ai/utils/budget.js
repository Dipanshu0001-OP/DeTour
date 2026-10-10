import { assembleItinerary, scheduleDay } from './itinerary.js';
import {
  formatINR, getRejectionReason, isMeal, isPriceKnown, normalizeInterest, round2,
} from './shared.js';

export const MIN_ALTERNATIVE_SIMILARITY = 0.34;
const DEFAULT_MAX_SWAPS = 5;

export function alternativeSimilarity(original, candidate) {
  const a = new Set((original.interests ?? []).map(normalizeInterest));
  const b = new Set((candidate.interests ?? []).map(normalizeInterest));
  const union = new Set([...a, ...b]).size;
  const shared = [...a].filter((x) => b.has(x)).length;
  const jaccard = union === 0 ? 0 : shared / union;
  const sameCategory = original.category === candidate.category ? 1 : 0;
  return 0.5 * sameCategory + 0.5 * jaccard;
}

const brief = (p) => ({ id: p.id, name: p.name, pricePerPerson: p.pricePerPerson, category: p.category });

export function optimizeBudget(itinerary, alternatives, budget, options = {}) {
  const { force = false, maxSwaps = DEFAULT_MAX_SWAPS } = options;
  const prefs = itinerary.preferences;
  const groupSize = itinerary.groupSize;
  const budgetTotal = Number.isFinite(budget) ? budget : itinerary.budgetTotal;
  const previousTotalCost = itinerary.totalCost;

  const lists = itinerary.days.map((d) => d.items.map((i) => ({ ...i })));
  const used = new Set(lists.flat().map((i) => i.id));
  let pool = (alternatives ?? []).filter(
    (a) => !used.has(a.id) && isPriceKnown(a) && getRejectionReason(prefs, a) === null);

  const totalPerPerson = () =>
    lists.flat().filter(isPriceKnown).reduce((s, i) => s + i.pricePerPerson, 0);

  const swaps = [];
  while (swaps.length < maxSwaps) {
    const overBudget = totalPerPerson() * groupSize > budgetTotal + 1e-9;
    if (!overBudget && !force) break;

    let best = null;
    lists.forEach((list, dayIndex) => {
      list.forEach((item, itemIndex) => {
        if (!isPriceKnown(item) || item.pricePerPerson <= 0) return;
        for (const alt of pool) {
          if (alt.pricePerPerson >= item.pricePerPerson) continue;
          if (isMeal(alt) !== isMeal(item)) continue;
          const similarity = alternativeSimilarity(item, alt);
          if (similarity < MIN_ALTERNATIVE_SIMILARITY) continue;
          const trial = list.map((x, idx) => (idx === itemIndex ? alt : x));
          if (!scheduleDay(trial).fits) continue;
          const saving = item.pricePerPerson - alt.pricePerPerson;
          const value = 0.6 * similarity + 0.4 * (saving / item.pricePerPerson);
          if (!best || value > best.value || (value === best.value && saving > best.saving)) {
            best = { dayIndex, itemIndex, item, alt, saving, value };
          }
        }
      });
    });
    if (!best) break;

    lists[best.dayIndex][best.itemIndex] = best.alt;
    pool = pool.filter((a) => a.id !== best.alt.id);
    swaps.push({
      day: best.dayIndex + 1,
      removed: brief(best.item),
      added: brief(best.alt),
      savingPerPerson: round2(best.saving),
      savingTotal: round2(best.saving * groupSize),
    });
  }

  const optimized = assembleItinerary(prefs, lists, itinerary.skipped);
  const withinBudget = optimized.totalCost <= budgetTotal + 1e-9;
  const savingsTotal = round2(previousTotalCost - optimized.totalCost);

  let message;
  if (swaps.length === 0 && previousTotalCost <= budgetTotal + 1e-9 && !force) {
    message = 'Your itinerary is already within budget.';
  } else if (swaps.length === 0) {
    message = 'No cheaper compatible alternatives were found.';
  } else if (withinBudget) {
    message = `Budget Rescue made ${swaps.length} swap(s) and saved an estimated ${formatINR(savingsTotal)}.`;
  } else {
    message = `Saved an estimated ${formatINR(savingsTotal)}, but the itinerary is still over budget. Consider removing an item.`;
  }

  return {
    itinerary: optimized,
    swaps,
    changed: swaps.length > 0,
    previousTotalCost,
    newTotalCost: optimized.totalCost,
    savingsTotal,
    savingsPerPerson: round2(savingsTotal / groupSize),
    budgetTotal,
    withinBudget,
    message,
  };
}

export function calculateLocalImpact(itinerary, options = {}) {
  const groupSize = itinerary?.groupSize ?? 1;
  const items = itinerary?.items ?? [];
  const priced = items.filter(isPriceKnown);
  const community = items.filter((i) => i.community?.isCommunityRun);
  const communityPriced = community.filter(isPriceKnown);

  const sum = (list) => round2(list.reduce((s, i) => s + i.pricePerPerson, 0) * groupSize);
  const totalSpend = sum(priced);
  const communitySpend = sum(communityPriced);
  const verifiedCommunitySpend = sum(communityPriced.filter((i) => i.community.verified));

  return {
    communitySpend,
    verifiedCommunitySpend,
    unverifiedCommunitySpend: round2(communitySpend - verifiedCommunitySpend),
    totalSpend,
    sharePercent: totalSpend > 0 ? Math.round((communitySpend / totalSpend) * 1000) / 10 : 0,
    communityItemCount: community.length,
    unpricedCommunityItemCount: community.length - communityPriced.length,
    anyEstimatedPrices: communityPriced.some((i) => i.priceIsEstimate),
    estimatedSavings: Number.isFinite(options.savings) ? round2(options.savings) : null,
    disclaimer:
      'Estimate of planned spending at community-run providers, based on listed prices. ' +
      'It is not a measure of donations, provider income or verified impact.',
  };
}