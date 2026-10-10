# DeTour AI — Integration Guide

## What calls what

The AWS backend retrieves listings from DynamoDB, validates a traveller's preferences, invokes `getRecommendations`, and returns the ranked list to the React frontend. The Lambda package includes the AI module's source files so deployment does not depend on a separate package registry download at request time.

## Request shape

```json
{
  "destination": "Dehradun",
  "budgetPerPerson": 1500,
  "groupType": "solo",
  "groupSize": 1,
  "diet": "vegetarian",
  "interests": ["nature", "culture", "hidden-gems"],
  "durationDays": 1,
  "hiddenGemsOnly": false,
  "query": "quiet local experiences away from crowds"
}
```

Required fields include `destination` and a non-negative numeric `budgetPerPerson`. `groupSize` must be an integer from 1 through 100, `durationDays` an integer from 1 through 14, and `groupType` one of `solo`, `couple`, `friends`, `family`, or `group`. Accepted diet aliases are validated in `src/utils/shared.js`.

## Listing fields

The engine uses `id`, `city`, `name`, `description`, `category`, `pricePerPerson`, `groupTypes`, `dietaryTags`, `interests`, `tags`, and `community`. Optional fields include `durationMinutes`, `trendScore`, `trendDate`, `dataSource`, and `priceIsEstimate`.

The integrated seed snapshot is derived from `frontend/src/data/demoPlaces.js`. Keep that dataset and `infra/data/places.json` in sync when new demo listings are added.

## Response compatibility

The AWS endpoint returns:

```json
{
  "recommendations": [
    {
      "id": "example-id",
      "score": 75.5,
      "matchScore": 0.755,
      "matchMode": "keyword-fallback",
      "explanation": ["Matches your interest in nature."],
      "reasons": ["Matches your interest in nature."],
      "priceUnknown": false
    }
  ],
  "meta": {
    "app": "DeTour",
    "engine": "DeTour AI recommendation engine",
    "mode": "keyword-fallback"
  }
}
```

The `score` uses the engine's 0–100 scale; `matchScore` is normalized to 0–1 for the current React card component. The `reasons` alias contains the same explanation entries for UI compatibility.

## Semantic model in AWS

The full embedding-based path is available via `getRecommendations` and `preloadModel`. The deployed Lambda intentionally passes `{ useSemantic: false }` for a reliable hackathon cold start and predictable runtime. Do not describe AWS responses as embedding-based semantic matching; the current Lambda mode is the AI engine's keyword fallback with the same preference filters and scoring components.

## Data integrity

- Demo prices are estimates where marked; `null` means unknown, not free.
- Provider records are unverified unless the record explicitly says otherwise.
- Do not mark listings verified without independent evidence.
- The current model and test fixtures do not verify availability, prices, opening hours, or provider identity.
