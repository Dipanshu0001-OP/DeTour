# DeTour integration map

## Agreed contract

| Area | Contract |
|---|---|
| Product name | DeTour |
| Frontend base URL | `VITE_API_URL` |
| Recommendation route | `POST /recommendations` (also supports `POST /recommend`) |
| Places route | `GET /places?city=Dehradun` |
| Health route | `GET /health` |
| Request destination | `destination` |
| Request preferences | `budgetPerPerson`, `groupType`, `groupSize`, `diet`, `interests`, `durationDays`, `hiddenGemsOnly`, `query` |
| Response | `{ recommendations: [], meta: {} }` |
| UI compatibility | Results include `matchScore` (0–1) and `reasons` (array), plus AI fields |
| Source of demo listings | `frontend/src/data/demoPlaces.js`; checked-in DynamoDB snapshot at `infra/data/places.json` |

## Decisions that keep the demo reliable

- The frontend's previous `/recommendations` path is implemented as-is, with `/recommend` retained as an alias.
- The two handoff datasets conflicted (Uttarakhand frontend listings vs illustrative Jaipur AI fixtures). The integrated demo uses the frontend's 30 Uttarakhand listings as the single seed source and does not return Jaipur fixtures.
- The AI engine runs with `useSemantic: false` in Lambda, still applying its preference validation, hard filters, keyword similarity, scoring, and explanations. This avoids first-request model download/cold-start risk. Full embedding model support remains in `ai/` and can be evaluated locally.
- All seeded records retain `dataSource: "demo"` and `priceIsEstimate: true`; the UI should not imply that community providers or listings were independently verified.
- `GET /places` requires an explicit city and queries the DynamoDB city partition key; it does not scan the entire table.

## Demo checks

- [ ] `npm test` passes in `infra/`
- [ ] `sam validate --lint` passes
- [ ] `sam build` passes
- [ ] `GET /health` returns app `DeTour`
- [ ] Seed command reports 23 records upserted
- [ ] `GET /places?city=Dehradun` returns Dehradun records
- [ ] Vegetarian and budget restrictions affect recommendations
- [ ] Frontend `VITE_API_URL` points to the stack's `ApiBaseUrl`
- [ ] Demo explains estimated prices and demo providers honestly
