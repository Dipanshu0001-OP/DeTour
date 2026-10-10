// Generates a time- and budget-constrained ordered itinerary.

export function generateItinerary(prefs, recs) {
  const maxMinutes = (prefs.durationDays || 1) * 480; // ~8h of activity per day
  const maxBudget = prefs.budgetPerPerson ?? Infinity;
  let used = 0;
  let cost = 0;
  const out = [];

  for (const r of recs) {
    const price = r.pricePerPerson ?? 0;
    if (used + r.durationMinutes <= maxMinutes && cost + price <= maxBudget) {
      out.push(r);
      used += r.durationMinutes;
      cost += price;
    }
  }
  return out;
}
