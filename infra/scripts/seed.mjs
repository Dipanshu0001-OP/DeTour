import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';

const here = path.dirname(fileURLToPath(import.meta.url));
const defaultTable = process.env.TABLE_NAME;
const argIndex = process.argv.indexOf('--table');
const tableName = (argIndex >= 0 ? process.argv[argIndex + 1] : null) || defaultTable;
const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'ap-south-1';
if (!tableName) {
  console.error('Missing table name. Pass --table detour-places-dev or set TABLE_NAME.');
  process.exit(1);
}

const placesPath = path.resolve(here, '../data/places.json');
const places = JSON.parse(fs.readFileSync(placesPath, 'utf8'));
if (!Array.isArray(places) || places.length === 0) throw new Error('Seed dataset is empty or invalid.');
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region }), {
  marshallOptions: { removeUndefinedValues: true },
});
const chunks = [];
for (let i = 0; i < places.length; i += 25) chunks.push(places.slice(i, i + 25));

let written = 0;
for (const chunk of chunks) {
  let unprocessed = chunk.map((Item) => ({ PutRequest: { Item } }));
  for (let attempt = 0; unprocessed.length && attempt < 6; attempt++) {
    const result = await ddb.send(new BatchWriteCommand({
      RequestItems: { [tableName]: unprocessed },
    }));
    unprocessed = result.UnprocessedItems?.[tableName] ?? [];
    if (unprocessed.length) await new Promise((resolve) => setTimeout(resolve, 150 * (2 ** attempt)));
  }
  if (unprocessed.length) throw new Error(`DynamoDB left ${unprocessed.length} writes unprocessed; rerun the seed command.`);
  written += chunk.length;
}
console.log(`Seed complete: ${written} DeTour demo places upserted into ${tableName} in ${region}.`);
console.log('Reminder: listings and prices are illustrative demo data, not live-verified offers.');
