import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { canonicalCity, compatibleRecommendationPayload, rankPlaces } from './logic.mjs';

const TABLE_NAME = process.env.TABLE_NAME;
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}), {
  marshallOptions: { removeUndefinedValues: true },
});

function corsOrigin(requestOrigin) {
  if (ALLOWED_ORIGIN === '*') return '*';
  return requestOrigin === ALLOWED_ORIGIN ? ALLOWED_ORIGIN : ''; 
}

function response(statusCode, body, origin = '') {
  return {
    statusCode,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'access-control-allow-origin': corsOrigin(origin),
      'access-control-allow-headers': 'content-type,authorization',
      'access-control-allow-methods': 'GET,POST,OPTIONS',
      'cache-control': 'no-store',
      vary: 'origin',
    },
    body: JSON.stringify(body),
  };
}

function parseBody(event) {
  if (!event.body) return {};
  const raw = event.isBase64Encoded
    ? Buffer.from(event.body, 'base64').toString('utf8')
    : event.body;
  return JSON.parse(raw);
}

async function queryAllCityPages(city) {
  if (!TABLE_NAME) throw new Error('TABLE_NAME is not configured');
  const items = [];
  let ExclusiveStartKey;
  do {
    const result = await ddb.send(new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: '#city = :city',
      ExpressionAttributeNames: { '#city': 'city' },
      ExpressionAttributeValues: { ':city': city },
      ExclusiveStartKey,
    }));
    items.push(...(result.Items ?? []));
    ExclusiveStartKey = result.LastEvaluatedKey;
  } while (ExclusiveStartKey);
  return items;
}

async function loadPlaces(city) {
  const cityKey = canonicalCity(city);
  // Only curated destination keys are supported in this MVP; no full-table scan.
  return queryAllCityPages(cityKey);
}

export async function handler(event) {
  const method = event?.requestContext?.http?.method ?? event?.httpMethod ?? 'GET';
  const path = String(event?.rawPath ?? event?.path ?? '/').replace(/\/$/, '') || '/';
  const origin = event?.headers?.origin ?? event?.headers?.Origin ?? '';
  const query = event?.queryStringParameters ?? {};
  const requestId = event?.requestContext?.requestId ?? 'local';

  if (method === 'OPTIONS') return response(204, {}, origin);
  if (method === 'GET' && path === '/health') {
    return response(200, {
      status: 'ok',
      app: 'DeTour',
      tableConfigured: Boolean(TABLE_NAME),
      runtime: process.version,
    }, origin);
  }

  try {
    if (method === 'GET' && path === '/places') {
      if (!query.city || !String(query.city).trim()) {
        return response(400, { error: 'Missing required query parameter: city' }, origin);
      }
      const places = await loadPlaces(query.city);
      const category = query.category ? String(query.category).trim().toLowerCase() : null;
      const filtered = category ? places.filter((p) => String(p.category ?? '').toLowerCase() === category) : places;
      return response(200, { places: filtered, count: filtered.length, city: canonicalCity(query.city) }, origin);
    }

    if (method === 'POST' && ['/recommend', '/recommendations'].includes(path)) {
      let preferences;
      try {
        preferences = parseBody(event);
      } catch {
        return response(400, { error: 'Request body must be valid JSON.' }, origin);
      }
      if (!preferences || typeof preferences !== 'object' || Array.isArray(preferences)) {
        return response(400, { error: 'Request body must be a JSON object containing trip preferences.' }, origin);
      }
      if (!preferences.destination || !String(preferences.destination).trim()) {
        return response(400, { error: 'destination is required.' }, origin);
      }
      const places = await loadPlaces(preferences.destination);
      const results = await rankPlaces(preferences, places);
      const payload = compatibleRecommendationPayload(results, places.length);
      console.info(JSON.stringify({ requestId, route: path, statusCode: 200, candidateCount: places.length, returnedCount: results.length }));
      return response(200, payload, origin);
    }

    return response(404, { error: 'Route not found', app: 'DeTour' }, origin);
  } catch (error) {
    if (error?.name === 'InvalidPreferencesError') {
      return response(400, { error: error.message, details: error.details ?? [] }, origin);
    }
    console.error(JSON.stringify({
      requestId,
      route: path,
      statusCode: 500,
      errorName: error?.name ?? 'Error',
      message: error?.message ?? 'Unknown server error',
    }));
    return response(500, { error: 'The DeTour service could not complete the request.' }, origin);
  }
}
