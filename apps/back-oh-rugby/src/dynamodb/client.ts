import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

// DYNAMODB_ENDPOINT is only set for local development against DynamoDB Local;
// on Lambda the SDK resolves the regional endpoint automatically.
const client = new DynamoDBClient({
  endpoint: process.env.DYNAMODB_ENDPOINT,
});

export const ddb = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true },
});

export const TABLE_NAME = process.env.DYNAMODB_TABLE ?? 'oh-rugby-local';
