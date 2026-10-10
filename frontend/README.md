# DeTour

**Explore beyond the obvious.**

A personalized, community-first tourism platform focused initially on Dehradun and Uttarakhand.

## Run locally

```bash
npm.cmd install
npm.cmd run dev
```

Optional `.env.local`:

```env
VITE_API_URL=https://<api-id>.execute-api.<region>.amazonaws.com
```

If the API is unset or unavailable, the app uses its local recommendation engine.

## What's included

- React 18 + Vite + JavaScript
- Responsive editorial travel UI with ivory, forest-green and terracotta palette
- DeTour SVG mark and short opening splash
- Destination search and preference wizard
- Clickable destination, experience, hidden-gem, community-category and story cards with detail dialogs
- Results, itinerary, budget and Community Passport screens
- Reduced-motion styling and responsive layouts

## Data honesty

The initial dataset is a curated/demo starting point focused on Uttarakhand. The homepage's “Worth the detour” section is editorial, not live visitor-count data. Community cards describe discovery categories, not verified NGOs or partnerships. Prices, access and other trip details should be confirmed locally. Do not present demo records as verified providers.

## Stack

- React 18 + Vite
- Lucide React
- Plain CSS design system
- Optional AWS API Gateway + Lambda + DynamoDB backend

## Licence

MIT (confirm third-party asset licences before publishing).
