import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PlayerService } from '../../services/player.service';

@Component({
  selector: 'oh-rugby-login',
  imports: [FormsModule],
  template: `
    <div class="login-page">
      <div class="login-card">
        <span class="logo-oh">OH</span><span class="logo-rugby">RUGBY</span>
        <p class="hint">Choisis ton nom et entre ton code pour accéder à tes pronostics.</p>

        <select [(ngModel)]="playerId" class="player-select">
          <option value="" disabled selected>— Joueur —</option>
          @for (p of playerService.players(); track p.id) {
            <option [value]="p.id">{{ p.displayName }}</option>
          }
        </select>

        <input
          type="text"
          class="code-input"
          placeholder="Code"
          [(ngModel)]="code"
          (keyup.enter)="submit()">

        <button class="btn-primary" [disabled]="!playerId || !code || loading()" (click)="submit()">
          {{ loading() ? '...' : 'ENTRER' }}
        </button>

        @if (error()) {
          <p class="error">{{ error() }}</p>
        }
      </div>
    </div>
  `,
  styles: [`
    .login-page {
      display: flex; align-items: center; justify-content: center;
      padding: 3rem 1rem;
    }
    .login-card {
      display: flex; flex-direction: column; gap: 1rem;
      width: 100%; max-width: 320px;
      border: 2px solid var(--gold); padding: 2rem 1.5rem;
      text-align: center;
    }
    .logo-oh { font-size: 2rem; font-weight: 900; color: var(--gold); letter-spacing: -1px; }
    .logo-rugby { font-size: 2rem; font-weight: 900; color: var(--text); letter-spacing: 2px; }
    .hint { font-size: 0.75rem; color: var(--muted); margin-bottom: 0.5rem; }
    .player-select, .code-input {
      background: var(--bg); color: var(--text);
      border: 1px solid var(--border); padding: 0.6rem;
      font-size: 0.9rem; font-family: inherit;
    }
    .code-input { text-align: center; letter-spacing: 2px; text-transform: uppercase; }
    .error { color: var(--red); font-size: 0.75rem; letter-spacing: 1px; }
  `],
})
export class LoginComponent {
  readonly playerService = inject(PlayerService);
  private readonly router = inject(Router);

  playerId = '';
  code = '';
  loading = signal(false);
  error = signal<string | null>(null);

  submit(): void {
    if (!this.playerId || !this.code) return;
    this.loading.set(true);
    this.error.set(null);
    this.playerService.login(this.playerId, this.code.trim(), (success) => {
      this.loading.set(false);
      if (!success) {
        this.error.set('Code invalide.');
        return;
      }
      this.router.navigateByUrl('/');
    });
  }
}
