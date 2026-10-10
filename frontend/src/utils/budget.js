// TEMP STUB. Dipanshu owns this. optimizeBudget -> { itinerary, savings } (per person).
export function optimizeBudget(itin, alts, budget) {
  const sum = l => l.reduce((s, x) => s + (x.pricePerPerson ?? 0), 0);
  let cur = [...itin];
  while (sum(cur) > budget) {
    const worst = [...cur].sort((a, b) => (b.pricePerPerson ?? 0) - (a.pricePerPerson ?? 0))[0];
    const alt = alts.filter(a => !cur.includes(a) && a.category === worst.category && (a.pricePerPerson ?? 0) < (worst.pricePerPerson ?? 0))[0];
    cur = alt ? cur.map(x => x === worst ? alt : x) : cur.filter(x => x !== worst);
  }
  return { itinerary: cur, savings: sum(itin) - sum(cur) };
}
export function calculateLocalImpact(itin) {
  const c = itin.filter(x => x.community?.isCommunityRun);
  return { communitySpend: c.reduce((s, x) => s + (x.pricePerPerson ?? 0), 0), communityCount: c.length, total: itin.reduce((s, x) => s + (x.pricePerPerson ?? 0), 0) };
}
