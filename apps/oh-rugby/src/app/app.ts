import { Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { PlayerService } from './services/player.service';
import { MatchdayService } from './services/matchday.service';
import { RankingService } from './services/ranking.service';

@Component({
  imports: [RouterOutlet, RouterLink],
  selector: 'oh-rugby-root',
  template: `
    <div class="app-shell">
      <header class="nav">
        <a routerLink="/" class="nav-logo">
          <span class="logo-oh">OH</span><span class="logo-rugby">RUGBY</span>
        </a>
        <nav class="nav-links">
          <a routerLink="/" class="nav-link">ACCUEIL</a>
          <a routerLink="/ranking" class="nav-link">CLASSEMENT</a>
        </nav>
        @if (playerService.currentPlayer()) {
        <div class="player-selector">
          <span class="player-label">JOUEUR</span>
          <select
            [value]="playerService.currentPlayer()!.id"
            (change)="onPlayerChange($event)">
            @for (p of playerService.players(); track p.id) {
              <option [value]="p.id">{{ p.displayName }}</option>
            }
          </select>
        </div>
        }
      </header>

      <main class="main-content">
        <router-outlet />
      </main>

      <footer class="footer">
        <span>OH RUGBY © 2026</span>
        <span>TOP 14 PRONOSTICS</span>
      </footer>
    </div>
  `,
  styles: [`
    .app-shell { min-height: 100vh; display: flex; flex-direction: column; }
    .nav {
      display: flex; align-items: center; justify-content: space-between;
      padding: 0.75rem 1.5rem;
      border-bottom: 2px solid var(--gold);
      background: var(--bg);
      position: sticky; top: 0; z-index: 100;
    }
    .nav-logo { text-decoration: none; display: flex; align-items: baseline; gap: 0.1rem; }
    .logo-oh { font-size: 1.5rem; font-weight: 900; color: var(--gold); letter-spacing: -1px; }
    .logo-rugby { font-size: 1.5rem; font-weight: 900; color: var(--text); letter-spacing: 2px; }
    .nav-links { display: flex; gap: 1.5rem; }
    .nav-link {
      color: var(--muted); text-decoration: none;
      font-size: 0.7rem; font-weight: 700; letter-spacing: 3px;
    }
    .nav-link:hover { color: var(--gold); }
    .player-selector { display: flex; align-items: center; gap: 0.5rem; }
    .player-label { font-size: 0.6rem; letter-spacing: 3px; color: var(--muted); }
    .player-selector select {
      background: var(--bg); color: var(--text);
      border: 1px solid var(--border); padding: 0.25rem 0.5rem;
      font-size: 0.8rem; font-weight: 700; cursor: pointer;
    }
    .main-content { flex: 1; max-width: 640px; width: 100%; margin: 0 auto; padding: 1.5rem 1rem; }
    .footer {
      display: flex; justify-content: space-between;
      padding: 0.75rem 1.5rem;
      border-top: 1px solid var(--border);
      font-size: 0.6rem; letter-spacing: 3px; color: var(--muted);
    }
  `],
})
export class App {
  playerService = inject(PlayerService);
  private matchdayService = inject(MatchdayService);
  private rankingService = inject(RankingService);

  constructor() {
    this.playerService.load();
    this.matchdayService.load();
    this.rankingService.loadGlobal();
  }

  onPlayerChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.playerService.setCurrentPlayer(select.value);
  }
}
