import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Player } from '@org/models';

const API_URL = 'http://localhost:3333/api';

@Injectable({ providedIn: 'root' })
export class PlayerService {
  private readonly http = inject(HttpClient);

  readonly players = signal<Player[]>([]);
  readonly currentPlayer = signal<Player | null>(null);

  load(): void {
    this.http.get<Player[]>(`${API_URL}/players`).subscribe({
      next: (players) => {
        this.players.set(players);
        this.currentPlayer.set(players[0] ?? null);
      },
      error: (error) => console.error('Impossible de charger les joueurs.', error),
    });
  }

  setCurrentPlayer(playerId: string): void {
    const player = this.players().find((candidate) => candidate.id === playerId);
    if (player) this.currentPlayer.set(player);
  }
}
