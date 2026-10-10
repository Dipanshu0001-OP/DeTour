
import { getRecommendations, preloadModel } from '../index.js';
import { FIXTURE_PLACES } from './fixtures.js';

const preferences = {
  destination: 'Jaipur',
  budgetPerPerson: 1500,
  groupType: 'solo',
  groupSize: 1,
  diet: 'vegetarian',
  interests: ['crafts', 'culture'],
  durationDays: 1,
  hiddenGemsOnly: false,
  query: 'local experiences and traditional crafts',
};

try {
  console.log('Loading real embedding model...');
  await preloadModel();

  console.log('Generating recommendations...');
  const recommendations = await getRecommendations(
    preferences,
    FIXTURE_PLACES
  );

  console.log(`Recommendations returned: ${recommendations.length}`);

  for (const place of recommendations.slice(0, 5)) {
    console.log({
      name: place.name,
      pricePerPerson: place.pricePerPerson,
      score: place.score,
      matchMode: place.matchMode,
      explanation: place.explanation,
    });
  }

  const invalidFood = recommendations.filter(
    (p) =>
      p.category === 'food' &&
      !(p.dietaryTags ?? []).some((tag) =>
        ['vegetarian', 'vegan', 'jain'].includes(tag)
      )
  );

  if (invalidFood.length > 0) {
    throw new Error('Dietary filter allowed an incompatible food listing.');
  }

  console.log('PASS: Real-model recommendation flow completed.');
} catch (error) {
  console.error('FAIL:', error);
  process.exitCode = 1;
}
