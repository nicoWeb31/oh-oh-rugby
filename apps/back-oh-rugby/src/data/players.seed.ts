import { Player } from '@org/models';

export const MOCK_PLAYERS: Player[] = [
  { id: 'p1', displayName: 'Thomas' },
  { id: 'p2', displayName: 'Nicolas' },
  { id: 'p3', displayName: 'Marjory' },
];

// Access codes: not part of the public Player model, never returned by the
// API (see player.repository.ts) — a lightweight deterrent against playing
// as someone else, not real authentication.
export const MOCK_PLAYER_CODES: Record<string, string> = {
  p1: 'PD682446BA0',
  p2: 'P45E9C591FE',
  p3: 'PA1A84F3D88',
};
