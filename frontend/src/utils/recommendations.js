// Recommendation engine — deterministic scoring + filters.
// Contract: returns places with { matchScore: 0..1, reasons: string[] }.

export async function getRecommendations(prefs, places) {
  const interests = prefs.interests || [];
  const diet = prefs.diet || 'any';
  const budget = prefs.budgetPerPerson ?? Infinity;
  const hiddenOnly = !!prefs.hiddenGemsOnly;
  const group = prefs.groupType || 'solo';
  const dest = (prefs.destination || '').toLowerCase();

  let candidates = places.filter((p) => {
    // Destination soft filter (city or nearby)
    if (dest && dest !== 'any') {
      const city = (p.city || '').toLowerCase();
      const destMatch =
        city.includes(dest) ||
        dest.includes(city) ||
        (dest === 'dehradun' && ['dehradun', 'mussoorie', 'rishikesh'].some((c) => city.includes(c)));
      if (!destMatch) return false;
    }

    // Budget hard filter (unknown prices pass through)
    if (p.pricePerPerson != null && p.pricePerPerson > budget) return false;

    // Dietary hard filter for food
    if (p.category === 'food' && diet === 'vegetarian') {
      if (!p.dietaryTags?.includes('vegetarian')) return false;
    }

    // Hidden gem mode
    if (hiddenOnly && !p.tags?.includes('hidden-gem') && !p.interests?.includes('hidden-gems')) {
      return false;
    }

    // Group suitability
    if (p.groupTypes && p.groupTypes.length && !p.groupTypes.includes(group)) {
      return false;
    }

    return true;
  });

  const scored = candidates.map((p) => {
    const matchedInterests = (p.interests || []).filter((i) => interests.includes(i));
    const interestScore = interests.length
      ? matchedInterests.length / Math.max(interests.length, 1)
      : 0.3;

    // Budget fit (closer to mid-budget scores higher, free items score well for low budgets)
    let budgetScore = 0.7;
    if (p.pricePerPerson != null && budget < Infinity) {
      const ratio = p.pricePerPerson / Math.max(budget, 1);
      budgetScore = ratio <= 0.5 ? 1 : ratio <= 0.8 ? 0.8 : ratio <= 1 ? 0.6 : 0.2;
    }

    // Community relevance
    const communityScore = p.community?.isCommunityRun ? 0.9 : 0.4;

    // Hidden-gem / trend soft boost
    const gemBoost = p.tags?.includes('hidden-gem') ? 0.15 : 0;
    const trendScore = Math.min(1, (p.trendScore || 0) + gemBoost);

    // Weighted total (mirrors original formula spirit)
    const matchScore = Math.min(
      1,
      0.35 * interestScore +
        0.25 * budgetScore +
        0.15 * (p.groupTypes?.includes(group) ? 1 : 0.5) +
        0.15 * communityScore +
        0.1 * trendScore
    );

    const reasons = [];
    if (matchedInterests.length) {
      reasons.push(`Matches your interest in ${matchedInterests.join(', ')}`);
    }
    if (p.community?.isCommunityRun) {
      reasons.push(`Supports a local ${p.community.providerType || 'community'} initiative`);
    }
    if (p.tags?.includes('hidden-gem')) {
      reasons.push('A lesser-known spot most travellers miss');
    }
    if (p.pricePerPerson === 0) {
      reasons.push('Free experience — easy on the budget');
    } else if (p.pricePerPerson != null && p.pricePerPerson <= budget * 0.4) {
      reasons.push('Fits comfortably within your budget');
    }
    if (!reasons.length) reasons.push('Good general fit for your trip');

    return { ...p, matchScore, reasons };
  });

  return scored.sort((a, b) => b.matchScore - a.matchScore);
}
