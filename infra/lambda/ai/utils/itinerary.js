import {
  computeTotals, durationOf, formatClock, formatINR, hasKnownDuration, isMeal, isPriceKnown,
  normalizePreferences, round2,
} from './shared.js';

export const DAY_START_MINUTE = 9 * 60;
export const DAY_END_MINUTE = 21 * 60;
export const TRAVEL_BUFFER_MINUTES = 30;
export const MEAL_START_MINUTES = [12 * 60 + 30, 19 * 60];
export const MAX_MEALS_PER_DAY = 2;

export function scheduleDay(items) {
  const activities = items.filter((i) => !isMeal(i));
  const meals = items.filter(isMeal);
  const scheduled = [];
  let cursor = DAY_START_MINUTE;
  let mealIndex = 0;
  let fits = true;

  const place = (item, start) => {
    const end = start + durationOf(item);
    if (end > DAY_END_MINUTE) fits = false;
    scheduled.push({
      ...item,
      startMinute: start,
      endMinute: end,
      startTime: formatClock(start),
      endTime: formatClock(end),
      durationAssumed: !hasKnownDuration(item),
    });
    cursor = end + TRAVEL_BUFFER_MINUTES;
  };

  while (activities.length || meals.length) {
    const mealStart = MEAL_START_MINUTES[Math.min(mealIndex, MEAL_START_MINUTES.length - 1)];
    const mealDue = meals.length > 0 && (activities.length === 0 || cursor >= mealStart);
    if (mealDue) {
      place(meals.shift(), Math.max(cursor, mealStart));
      mealIndex++;
    } else {
      place(activities.shift(), cursor);
    }
  }
  return { items: scheduled, fits };
}

export function assembleItinerary(prefs, dayItemLists, skipped = {}) {
  const days = dayItemLists.map((list, i) => {
    const { items, fits } = scheduleDay(list);
    return {
      day: i + 1,
      items,
      fits,
      totalCostPerPerson: round2(items.filter(isPriceKnown).reduce((s, it) => s + it.pricePerPerson, 0)),
    };
  });
  const items = days.flatMap((d) => d.items);
  const totals = computeTotals(items, prefs);
  const skip = { unpriced: [], overBudget: [], noTime: [], ...skipped };

  const warnings = [];
  if (items.length === 0) {
    warnings.push('No experiences could be scheduled. Try a higher budget, more days or fewer restrictions.');
  }
  if (totals.unpricedItemIds.length) {
    warnings.push(`Total excludes ${totals.unpricedItemIds.length} item(s) whose price is unknown.`);
  }
  if (skip.unpriced.length) {
    warnings.push(`${skip.unpriced.length} experience(s) were left out because their price is unknown.`);
  }
  if (!totals.withinBudget) {
    warnings.push(`Itinerary is ${formatINR(round2(totals.totalCost - totals.budgetTotal))} over budget. Try Budget Rescue.`);
  }
  if (items.some((i) => i.durationAssumed)) {
    warnings.push('Some durations are unknown; 60 minutes was assumed for scheduling.');
  }

  return { preferences: prefs, groupSize: prefs.groupSize, days, items, ...totals, skipped: skip, warnings };
}

const dayMinutes = (list) => list.reduce((s, i) => s + durationOf(i), 0);
const mealCount = (list) => list.filter(isMeal).length;

function findDayFor(dayLists, place) {
  const order = dayLists.map((_, i) => i).sort((a, b) => dayMinutes(dayLists[a]) - dayMinutes(dayLists[b]));
  for (const i of order) {
    if (isMeal(place) && mealCount(dayLists[i]) >= MAX_MEALS_PER_DAY) continue;
    if (scheduleDay([...dayLists[i], place]).fits) return i;
  }
  return -1;
}

export function generateItinerary(preferences, recommendations, options = {}) {
  const prefs = normalizePreferences(preferences);
  if (!Array.isArray(recommendations)) throw new TypeError('recommendations must be an array');
  const { includeUnpriced = false } = options;

  const dayLists = Array.from({ length: prefs.durationDays }, () => []);
  const skipped = { unpriced: [], overBudget: [], noTime: [] };
  const seen = new Set();
  let spentPerPerson = 0;

  const ranked = [...recommendations].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  for (const rec of ranked) {
    if (seen.has(rec.id)) continue;
    seen.add(rec.id);

    const known = isPriceKnown(rec);
    if (!known && !includeUnpriced) { skipped.unpriced.push(rec.id); continue; }
    const price = known ? rec.pricePerPerson : 0;
    if (spentPerPerson + price > prefs.budgetPerPerson + 1e-9) { skipped.overBudget.push(rec.id); continue; }

    const dayIndex = findDayFor(dayLists, rec);
    if (dayIndex === -1) { skipped.noTime.push(rec.id); continue; }

    dayLists[dayIndex].push(rec);
    spentPerPerson += price;
  }
  return assembleItinerary(prefs, dayLists, skipped);
}

const toDayLists = (itinerary) => itinerary.days.map((d) => d.items);

export function addToItinerary(itinerary, place) {
  if (itinerary.items.some((i) => i.id === place.id)) {
    return { itinerary, added: false, reason: 'already-in-itinerary' };
  }
  const lists = toDayLists(itinerary);
  const dayIndex = findDayFor(lists, place);
  if (dayIndex === -1) return { itinerary, added: false, reason: 'no-time' };
  lists[dayIndex] = [...lists[dayIndex], place];
  return { itinerary: assembleItinerary(itinerary.preferences, lists, itinerary.skipped), added: true, reason: null };
}

export function removeFromItinerary(itinerary, placeId) {
  const lists = toDayLists(itinerary).map((list) => list.filter((i) => i.id !== placeId));
  return assembleItinerary(itinerary.preferences, lists, itinerary.skipped);
}