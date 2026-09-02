import { GetCommand, PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { Player } from '@org/models';
import { ddb, TABLE_NAME } from '../dynamodb/client';
import { playerKey, stripKeys } from '../dynamodb/keys';

// `code` lives on the same item but is never part of the public Player
// shape returned by the API — strip it explicitly rather than relying on
// callers to remember not to leak it.
function toPublicPlayer(item: Record<string, unknown>): Player {
  const player = { ...stripKeys<Player & { code?: string }>(item as never) };
  delete player.code;
  return player;
}

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
  return (result.Items ?? []).map(toPublicPlayer);
}

export async function getPlayer(id: string): Promise<Player | undefined> {
  const result = await ddb.send(new GetCommand({ TableName: TABLE_NAME, Key: playerKey(id) }));
  return result.Item ? toPublicPlayer(result.Item) : undefined;
}

// Lightweight deterrent against playing as someone else, not real auth:
// codes are static and shared by word of mouth within the friends group.
export async function verifyCode(playerId: string, code: string): Promise<boolean> {
  const result = await ddb.send(new GetCommand({ TableName: TABLE_NAME, Key: playerKey(playerId) }));
  return typeof result.Item?.code === 'string' && result.Item.code === code;
}

export async function putPlayer(player: Player): Promise<void> {
  await ddb.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: { ...playerKey(player.id), entityType: 'PLAYER', ...player },
    })
  );
}
