export const DEFAULT_DURATION_MINUTES = 60;
export const GROUP_TYPES = ['solo', 'couple', 'friends', 'family', 'group'];
export const HIDDEN_GEM_TAG = 'hidden-gem';

export class InvalidPreferencesError extends Error {
  constructor(message, details = []) {
    super(message);
    this.name = 'InvalidPreferencesError';
    this.details = details;
  }
}

export const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
export const clamp01 = (n) => Math.min(1, Math.max(0, n));
const lower = (s) => String(s ?? '').trim().toLowerCase();

export const isPriceKnown = (place) =>
  typeof place?.pricePerPerson === 'number' &&
  Number.isFinite(place.pricePerPerson) &&
  place.pricePerPerson >= 0;

export const isMeal = (place) => place?.category === 'food';

export const hasKnownDuration = (place) =>
  Number.isFinite(place?.durationMinutes) && place.durationMinutes > 0;

export const durationOf = (place) =>
  hasKnownDuration(place) ? place.durationMinutes : DEFAULT_DURATION_MINUTES;

export const formatINR = (n) =>
  `\u20B9${Number(n).toLocaleString('en-IN')}`;

export function formatClock(totalMinutes) {
  const h = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
  const m = String(totalMinutes % 60).padStart(2, '0');
  return `${h}:${m}`;
}

const INTEREST_ALIASES = { craft: 'crafts', photo: 'photography' };
export function normalizeInterest(value) {
  const v = lower(value);
  return INTEREST_ALIASES[v] ?? v;
}

const DIET_ALIASES = {
  '': 'any', any: 'any', none: 'any', 'no preference': 'any',
  'non-vegetarian': 'any', 'non-veg': 'any', nonveg: 'any',
  veg: 'vegetarian', vegetarian: 'vegetarian',
  vegan: 'vegan', jain: 'jain', eggetarian: 'eggetarian',
};
export const normalizeDiet = (d) => DIET_ALIASES[lower(d)];

const DIET_ACCEPTS = {
  vegetarian: ['vegetarian', 'vegan', 'jain'],
  vegan: ['vegan'],
  jain: ['jain'],
  eggetarian: ['eggetarian', 'vegetarian', 'vegan', 'jain'],
};

export function normalizePreferences(input) {
  if (!input || typeof input !== 'object') {
    throw new InvalidPreferencesError('Preferences are required.', ['preferences missing']);
  }
  const errors = [];

  const destination = String(input.destination ?? '').trim();
  if (!destination) errors.push('destination is required');

  const budgetPerPerson = Number(input.budgetPerPerson);
  if (!Number.isFinite(budgetPerPerson) || budgetPerPerson < 0) {
    errors.push('budgetPerPerson must be a number >= 0');
  }

  const groupSize = Number(input.groupSize ?? 1);
  if (!Number.isInteger(groupSize) || groupSize < 1 || groupSize > 100) {
    errors.push('groupSize must be an integer between 1 and 100');
  }

  const durationDays = Number(input.durationDays ?? 1);
  if (!Number.isInteger(durationDays) || durationDays < 1 || durationDays > 14) {
    errors.push('durationDays must be an integer between 1 and 14');
  }

  const groupType = lower(input.groupType ?? 'solo');
  if (!GROUP_TYPES.includes(groupType)) {
    errors.push(`groupType must be one of: ${GROUP_TYPES.join(', ')}`);
  }

  const diet = normalizeDiet(input.diet ?? 'any');
  if (diet === undefined) errors.push('diet is not recognised');

  if (input.interests !== undefined && !Array.isArray(input.interests)) {
    errors.push('interests must be an array');
  }

  if (errors.length) {
    throw new InvalidPreferencesError(`Invalid preferences: ${errors.join('; ')}`, errors);
  }

  return {
    destination,
    ageGroup: input.ageGroup ?? null,
    groupType,
    groupSize,
    budgetPerPerson,
    interests: [...new Set((input.interests ?? []).map(normalizeInterest).filter(Boolean))],
    diet,
    durationDays,
    hiddenGemsOnly: Boolean(input.hiddenGemsOnly),
    query: String(input.query ?? '').trim().slice(0, 300),
  };
}

export function groupCompatible(place, groupType) {
  const types = place?.groupTypes;
  if (!Array.isArray(types) || types.length === 0) return null;
  const set = new Set(types.map(lower));
  if (set.has(groupType)) return true;
  if (groupType === 'group' && set.has('friends')) return true;
  return false;
}

export function dietCompatible(place, diet) {
  if (diet === 'any') return true;
  const tags = (place?.dietaryTags ?? []).map(lower);
  const foodListing = isMeal(place) || tags.length > 0;
  if (!foodListing) return true;
  return tags.some((t) => DIET_ACCEPTS[diet].includes(t));
}

export function getRejectionReason(prefs, place) {
  if (lower(place?.city) !== lower(prefs.destination)) return 'destination';
  if (prefs.hiddenGemsOnly && !(place.tags ?? []).map(lower).includes(HIDDEN_GEM_TAG)) {
    return 'not-hidden-gem';
  }
  if (groupCompatible(place, prefs.groupType) === false) return 'group';
  if (!dietCompatible(place, prefs.diet)) return 'diet';
  if (isPriceKnown(place) && place.pricePerPerson > prefs.budgetPerPerson) return 'budget';
  return null;
}

export function computeTotals(items, prefs) {
  let perPerson = 0;
  const unpricedItemIds = [];
  for (const item of items) {
    if (isPriceKnown(item)) perPerson += item.pricePerPerson;
    else unpricedItemIds.push(item.id);
  }
  const totalCost = round2(perPerson * prefs.groupSize);
  const budgetTotal = round2(prefs.budgetPerPerson * prefs.groupSize);
  return {
    totalCostPerPerson: round2(perPerson),
    totalCost,
    budgetPerPerson: prefs.budgetPerPerson,
    budgetTotal,
    remainingBudget: round2(budgetTotal - totalCost),
    withinBudget: totalCost <= budgetTotal + 1e-9,
    unpricedItemIds,
  };
}