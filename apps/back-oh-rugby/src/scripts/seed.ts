import { BatchWriteCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, TABLE_NAME } from '../dynamodb/client';
import { competitionKey, matchdayKey, playerKey, predictionKey } from '../dynamodb/keys';
import { MOCK_COMPETITION, MOCK_MATCHDAYS } from '../data/matchdays.seed';
import { MOCK_PLAYERS } from '../data/players.seed';
import { MOCK_PREDICTIONS } from '../data/predictions.seed';

// One-off script to populate a fresh DynamoDB table with demo data.
// Usage: DYNAMODB_TABLE=oh-rugby-dev AWS_REGION=eu-west-3 npx tsx apps/back-oh-rugby/src/scripts/seed.ts
async function seed() {
  const items = [
    { ...competitionKey(MOCK_COMPETITION.id), entityType: 'COMPETITION', ...MOCK_COMPETITION },
    ...MOCK_MATCHDAYS.map((matchday) => ({
      ...matchdayKey(matchday.id),
      entityType: 'MATCHDAY',
      ...matchday,
    })),
    ...MOCK_PLAYERS.map((player) => ({ ...playerKey(player.id), entityType: 'PLAYER', ...player })),
    ...MOCK_PREDICTIONS.map((prediction) => ({
      ...predictionKey(prediction.playerId, prediction.matchId),
      entityType: 'PREDICTION',
      ...prediction,
    })),
  ];

  // BatchWriteItem accepts at most 25 items per request.
  for (let i = 0; i < items.length; i += 25) {
    const chunk = items.slice(i, i + 25);
    await ddb.send(
      new BatchWriteCommand({
        RequestItems: { [TABLE_NAME]: chunk.map((item) => ({ PutRequest: { Item: item } })) },
      })
    );
  }

  console.log(`Seeded ${items.length} items into ${TABLE_NAME}.`);
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
