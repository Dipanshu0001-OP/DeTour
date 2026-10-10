# DeTour AWS backend

Serverless MVP: API Gateway HTTP API → Lambda → DynamoDB. The Lambda imports the team's DeTour AI recommendation engine and uses its deterministic keyword-fallback mode. This deliberately avoids downloading a large embedding model on a Lambda cold start; the full semantic-model implementation is preserved under `../ai` for local evaluation.

## Routes

- `GET /health`
- `GET /places?city=Dehradun` (optional `&category=food`)
- `POST /recommendations` (the React frontend's route)
- `POST /recommend` (alias)

Request body example:

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
  "query": "quiet nature spots away from crowds"
}
```

`/recommendations` responds with `{ "recommendations": [...], "meta": {...} }`. Each result contains the frontend's `matchScore` and `reasons` fields alongside the AI engine's `score`, `explanation`, `priceUnknown`, and `matchMode` fields.

## Prerequisites and safeguards

- Node.js 24 or later for local commands, AWS SAM CLI, and AWS CLI.
- Use an approved IAM/Identity Center role with only the required deployment permissions; do not create permanent root access keys.
- Review AWS Budgets/billing alerts before deployment.
- The API is unauthenticated for this hackathon MVP. Anyone with its URL may call it; do not put secrets or personal data in requests.
- `AllowedOrigin` defaults to `*` for quick local demo use. Set it to the deployed frontend's exact origin before publishing.
- DynamoDB uses on-demand billing to avoid idle provisioned capacity. API Gateway requests, Lambda duration, DynamoDB operations/storage, and CloudWatch logs can still incur charges.

## Validate and build

From this directory:

```bash
npm.cmd install
npm.cmd test
sam validate --lint
sam build
```

## Deploy

Do not start deployment until you have confirmed the AWS account/role, region, and billing safeguards:

```bash
sam deploy --guided
```

Suggested stack name: `detour-dev`; region: `ap-south-1`; confirm changes: `Y`; answer `N` to “Disable rollback?” (this keeps rollback enabled); allow SAM IAM role creation only if permitted by your team's IAM policy; save config: `Y`.

Before final approval, review the change set and ensure it contains only the DeTour API, Lambda/log group, and DynamoDB table.

## Seed the demo data

After deployment, read the stack output `TableName` and run with a role that has `dynamodb:BatchWriteItem` permission for that table:

```bash
npm.cmd run seed -- --table detour-places-dev
```

The dataset comes from `frontend/src/data/demoPlaces.js` (30 listings across Dehradun, Mussoorie, Rishikesh, and Nainital). If that source changes, run `npm.cmd run export:places` from `infra/` to refresh `infra/data/places.json`. The seed script upserts; it does not delete existing records.

## Smoke test

After seeding, use the `ApiBaseUrl` stack output:

```bash
curl "https://YOUR_API_ID.execute-api.ap-south-1.amazonaws.com/health"
curl "https://YOUR_API_ID.execute-api.ap-south-1.amazonaws.com/places?city=Dehradun"
```

For recommendations, POST a JSON body like the example above to `/recommendations` with `Content-Type: application/json`.
