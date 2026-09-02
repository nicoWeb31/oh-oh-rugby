import { BatchGetCommand, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { Matchday } from '@org/models';
import { ddb, TABLE_NAME } from '../dynamodb/client';
import { matchdayKey, stripKeys } from '../dynamodb/keys';

// Matches are embedded in their matchday item: they are always read together
// and never queried independently in the current API, so a separate Match
// entity/GSI would add write complexity without an access pattern to justify it.
export async function getMatchdayById(id: string): Promise<Matchday | undefined> {
  const result = await ddb.send(new GetCommand({ TableName: TABLE_NAME, Key: matchdayKey(id) }));
  return result.Item ? stripKeys<Matchday>(result.Item as never) : undefined;
}

export async function getMatchdaysByIds(ids: string[]): Promise<Matchday[]> {
  if (ids.length === 0) return [];

  const byId = new Map<string, Matchday>();
  // BatchGetItem caps out at 100 keys per request.
  for (let i = 0; i < ids.length; i += 100) {
    const chunk = ids.slice(i, i + 100);
    const result = await ddb.send(
      new BatchGetCommand({ RequestItems: { [TABLE_NAME]: { Keys: chunk.map(matchdayKey) } } })
    );
    for (const item of result.Responses?.[TABLE_NAME] ?? []) {
      const matchday = stripKeys<Matchday>(item as never);
      byId.set(matchday.id, matchday);
    }
  }
  return ids.map((id) => byId.get(id)).filter((matchday): matchday is Matchday => Boolean(matchday));
}

export async function putMatchday(matchday: Matchday): Promise<void> {
  await ddb.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: { ...matchdayKey(matchday.id), entityType: 'MATCHDAY', ...matchday },
    })
  );
}
