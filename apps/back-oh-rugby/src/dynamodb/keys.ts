export const competitionKey = (id: string) => ({ PK: `COMP#${id}`, SK: 'META' });
export const matchdayKey = (id: string) => ({ PK: `MATCHDAY#${id}`, SK: 'META' });
export const playerKey = (id: string) => ({ PK: `PLAYER#${id}`, SK: 'META' });
export const predictionKey = (playerId: string, matchId: string) => ({
  PK: `PLAYER#${playerId}`,
  SK: `PRED#${matchId}`,
});

// Match ids are always generated as `${matchdayId}-m${n}` (see data/matchdays.seed.ts),
// so the matchday is derivable without a reverse index or a table scan.
export const matchdayIdFromMatchId = (matchId: string): string => matchId.split('-m')[0];

export type ItemKeys = { PK: string; SK: string };

export function stripKeys<T>(item: ItemKeys & { entityType: string } & T): T {
  const rest = { ...item } as Partial<ItemKeys & { entityType: string }> & T;
  delete rest.PK;
  delete rest.SK;
  delete rest.entityType;
  return rest as T;
}
