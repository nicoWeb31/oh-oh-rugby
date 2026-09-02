import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
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
        @if (playerService.currentPlayer(); as player) {
          <div class="player-info">
            <span class="player-label">JOUEUR</span>
            <span class="player-name">{{ player.displayName }}</span>
            <button class="logout" (click)="logout()">CHANGER</button>
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
    .player-info { display: flex; align-items: center; gap: 0.6rem; }
    .player-label { font-size: 0.6rem; letter-spacing: 3px; color: var(--muted); }
    .player-name { font-size: 0.8rem; font-weight: 700; color: var(--text); }
    .logout {
      background: transparent; border: 1px solid var(--border); color: var(--muted);
      font-size: 0.6rem; letter-spacing: 2px; padding: 3px 8px; cursor: pointer;
      font-family: inherit; font-weight: 700;
    }
    .logout:hover { border-color: var(--gold); color: var(--gold); }
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
  private router = inject(Router);

  constructor() {
    this.playerService.load();
    this.matchdayService.load();
    this.rankingService.loadGlobal();
  }

  logout(): void {
    this.playerService.logout();
    this.router.navigateByUrl('/login');
  }
}
