import { PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { Prediction } from '@org/models';
import { ddb, TABLE_NAME } from '../dynamodb/client';
import { predictionKey, stripKeys } from '../dynamodb/keys';

export async function getPredictionsByPlayer(
  playerId: string,
): Promise<Prediction[]> {
  const result = await ddb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :prefix)',
      ExpressionAttributeValues: {
        ':pk': `PLAYER#${playerId}`,
        ':prefix': 'PRED#',
      },
    }),
  );
  return (result.Items ?? []).map((item) =>
    stripKeys<Prediction>(item as never),
  );
}

export async function putPrediction(prediction: Prediction): Promise<void> {
  await ddb.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        ...predictionKey(prediction.playerId, prediction.matchId),
        entityType: 'PREDICTION',
        ...prediction,
      },
    }),
  );
}
