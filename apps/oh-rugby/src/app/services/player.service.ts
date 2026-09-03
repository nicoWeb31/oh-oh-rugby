import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Player } from '@org/models';
import { environment } from '../../environments/environment';

const API_URL = environment.apiUrl;
const STORAGE_KEY = 'oh-rugby-auth';

interface StoredAuth {
  playerId: string;
  code: string;
}

@Injectable({ providedIn: 'root' })
export class PlayerService {
  private readonly http = inject(HttpClient);

  readonly players = signal<Player[]>([]);
  readonly currentPlayer = signal<Player | null>(null);
  private code: string | null = null;

  load(): void {
    this.http.get<Player[]>(`${API_URL}/players`).subscribe({
      next: (players) => {
        this.players.set(players);
        const stored = this.readStoredAuth();
        const player = stored && players.find((candidate) => candidate.id === stored.playerId);
        if (player && stored) {
          this.code = stored.code;
          this.currentPlayer.set(player);
        }
      },
      error: (error) => console.error('Impossible de charger les joueurs.', error),
    });
  }

  // Lightweight deterrent against playing as someone else, not real auth —
  // codes are static and shared by word of mouth within the group. The
  // server re-checks the code on every write that matters regardless.
  login(playerId: string, code: string, onDone: (success: boolean) => void): void {
    this.http.post<Player>(`${API_URL}/auth/verify`, { playerId, code }).subscribe({
      next: (player) => {
        this.code = code;
        this.currentPlayer.set(player);
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ playerId, code } satisfies StoredAuth));
        onDone(true);
      },
      error: () => onDone(false),
    });
  }

  logout(): void {
    this.code = null;
    this.currentPlayer.set(null);
    localStorage.removeItem(STORAGE_KEY);
  }

  getCode(): string | null {
    return this.code;
  }

  // Synchronous check (localStorage, not the async-loaded players list) so
  // the route guard can decide before the /players request resolves.
  hasStoredAuth(): boolean {
    return this.readStoredAuth() !== null;
  }

  private readStoredAuth(): StoredAuth | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as StoredAuth) : null;
    } catch {
      return null;
    }
  }
}
