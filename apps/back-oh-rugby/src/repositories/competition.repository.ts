import { GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { Competition } from '@org/models';
import { ddb, TABLE_NAME } from '../dynamodb/client';
import { competitionKey, stripKeys } from '../dynamodb/keys';

export async function getCompetition(id: string): Promise<Competition | undefined> {
  const result = await ddb.send(new GetCommand({ TableName: TABLE_NAME, Key: competitionKey(id) }));
  return result.Item ? stripKeys<Competition>(result.Item as never) : undefined;
}

export async function putCompetition(competition: Competition): Promise<void> {
  await ddb.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: { ...competitionKey(competition.id), entityType: 'COMPETITION', ...competition },
    })
  );
}
