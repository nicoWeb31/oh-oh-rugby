import { GetCommand, PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { Player } from '@org/models';
import { ddb, TABLE_NAME } from '../dynamodb/client';
import { playerKey, stripKeys } from '../dynamodb/keys';

// A handful of players are expected for V1 (friends-group scale), so a Scan
// filtered on entityType is cheap and avoids maintaining a players index.
export async function listPlayers(): Promise<Player[]> {
  const result = await ddb.send(
    new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression: 'entityType = :type',
      ExpressionAttributeValues: { ':type': 'PLAYER' },
    })
  );
  return (result.Items ?? []).map((item) => stripKeys<Player>(item as never));
}

export async function getPlayer(id: string): Promise<Player | undefined> {
  const result = await ddb.send(new GetCommand({ TableName: TABLE_NAME, Key: playerKey(id) }));
  return result.Item ? stripKeys<Player>(result.Item as never) : undefined;
}

export async function putPlayer(player: Player): Promise<void> {
  await ddb.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: { ...playerKey(player.id), entityType: 'PLAYER', ...player },
    })
  );
}
