# DeTour AI Recommendation Engine

The DeTour AI module powers personalized tourism recommendations, preference filtering, itinerary scheduling, budget optimization, and estimated local-impact summaries.

## Capabilities

- Semantic similarity with `@huggingface/transformers` and `Xenova/all-MiniLM-L6-v2`.
- Keyword fallback if model loading fails or semantic mode is disabled.
- Hard filters for destination, budget, dietary preferences, group suitability, and hidden gems.
- Explanations for recommendations, including explicit handling for unknown prices and unverified demo providers.
- Itinerary generation, budget optimization, alternative matching, and local-spend estimates.

## Install and test

```bash
npm.cmd install
npm.cmd test
npm.cmd run eval
npm.cmd run eval:mock
```

The optional real-model smoke test is:

```bash
npm.cmd run test:integration
```

The embedding model may download on first use and requires network access unless already cached. For the short hackathon demo, the AWS Lambda uses `{ useSemantic: false }` so requests don't wait for a large model download during a cold start. This still uses the AI module's preference validation, filtering, keyword ranking, scoring, and explanation flow.

## Public entry point

`src/index.js` exports `getRecommendations`, `preloadModel`, `filterPlaces`, `summarizeRejections`, `rankBySimilarity`, itinerary helpers, budget helpers, and shared validation/cost utilities. See `docs/INTEGRATION.md` for the input contract used by DeTour.

## Evaluation and demo-data limits

The preliminary evaluation in `src/tests/fixtures.js` uses illustrative Jaipur listings and eight natural-language queries. Those fixtures are for engine evaluation only; they are not DeTour's deployed listings. The integrated DeTour demo uses the frontend's curated Uttarakhand dataset (`frontend/src/data/demoPlaces.js`), exported as a seed snapshot to `infra/data/places.json`.

All demonstration listings and prices are illustrative. Provider verification, current opening hours, availability, and prices must be confirmed locally; the recommendation engine does not independently verify providers.
