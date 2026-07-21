import { Injectable, signal } from '@angular/core';
import { Player } from '@org/models';
import { MOCK_PLAYERS } from '../mocks/players.mock';

@Injectable({ providedIn: 'root' })
export class PlayerService {
  readonly players = signal<Player[]>(MOCK_PLAYERS);
  readonly currentPlayer = signal<Player>(MOCK_PLAYERS[0]);

  setCurrentPlayer(playerId: string): void {
    const player = MOCK_PLAYERS.find((p) => p.id === playerId);
    if (player) this.currentPlayer.set(player);
  }
}
