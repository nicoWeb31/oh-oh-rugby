import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatchdayService } from '../../services/matchday.service';
import { RankingService } from '../../services/ranking.service';
import { FormatDatePipe } from '../../pipes/format-date.pipe';

@Component({
  selector: 'oh-rugby-dashboard',
  imports: [RouterLink, FormatDatePipe],
  template: `
    <div class="dashboard">
      @if (competition()) {
        <div class="competition-banner">
          <span class="season">{{ competition()!.season }}</span>
          <h2 class="competition-name">{{ competition()!.name }}</h2>
        </div>
      }

      @if (activeMatchday()) {
        <section class="active-card">
          <div class="active-badge">ACTIVE</div>
          <div class="active-label">{{ activeMatchday()!.label }}</div>
          <p class="active-hint">Les pronostics sont ouverts jusqu'au vendredi soir</p>
          <a [routerLink]="['/matchday', activeMatchday()!.id]" class="btn-primary">
            SAISIR MES PRONOSTICS →
          </a>
        </section>
      } @else {
        <section class="no-active">
          <span>AUCUNE JOURNÉE ACTIVE</span>
        </section>
      }

      <section class="matchdays-grid">
        @for (md of allMatchdays(); track md.id) {
          <a [routerLink]="['/matchday', md.id]" class="md-card" [class]="statusClass(md.id)">
            <span class="md-label">{{ md.label }}</span>
            <span class="md-date">{{ md.date | formatDate }}</span>
            <span class="md-status">{{ statusLabel(md.id) }}</span>
          </a>
        }
      </section>

      <div class="quick-ranking">
        <h3>CLASSEMENT GÉNÉRAL</h3>
        <table class="ranking-table">
          <thead>
            <tr><th>#</th><th>JOUEUR</th><th>PTS</th></tr>
          </thead>
          <tbody>
            @for (entry of globalRanking(); track entry.playerId) {
              <tr>
                <td class="rank">{{ entry.rank }}</td>
                <td>{{ entry.displayName }}</td>
                <td class="points">{{ entry.points }}</td>
              </tr>
            }
          </tbody>
        </table>
        <a routerLink="/ranking" class="btn-secondary">VOIR LE CLASSEMENT COMPLET →</a>
      </div>
    </div>
  `,
  styles: [`
    .dashboard { display: flex; flex-direction: column; gap: 2rem; }
    .competition-banner {
      text-align: center;
      border-bottom: 2px solid var(--gold);
      padding-bottom: 1rem;
    }
    .season { font-size: 0.75rem; color: var(--gold); letter-spacing: 4px; text-transform: uppercase; }
    .competition-name { font-size: 2.5rem; font-weight: 900; letter-spacing: 6px; margin: 0.25rem 0 0; text-transform: uppercase; }
    .active-card {
      border: 2px solid var(--gold);
      padding: 1.5rem;
      text-align: center;
      background: rgba(232,200,74,0.05);
    }
    .active-badge {
      display: inline-block;
      background: var(--gold);
      color: var(--bg);
      font-size: 0.7rem;
      font-weight: 900;
      letter-spacing: 3px;
      padding: 2px 10px;
      margin-bottom: 0.5rem;
    }
    .active-label { font-size: 3rem; font-weight: 900; color: var(--gold); line-height: 1; }
    .active-hint { font-size: 0.8rem; color: var(--muted); margin: 0.5rem 0 1.25rem; }
    .no-active {
      border: 2px solid var(--muted);
      padding: 1rem;
      text-align: center;
      color: var(--muted);
      font-size: 0.75rem;
      letter-spacing: 3px;
    }
    .matchdays-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
      gap: 0.5rem;
    }
    .md-card {
      display: flex; flex-direction: column; align-items: center;
      border: 1px solid var(--muted);
      padding: 0.5rem 0.25rem;
      text-decoration: none;
      color: var(--text);
      gap: 0.15rem;
      transition: border-color 0.15s;
    }
    .md-card:hover { border-color: var(--gold); }
    .md-card.active { border-color: var(--gold); background: rgba(232,200,74,0.08); }
    .md-card.locked { opacity: 0.5; }
    .md-label { font-size: 1rem; font-weight: 900; }
    .md-date { font-size: 0.6rem; color: var(--muted); }
    .md-status { font-size: 0.55rem; letter-spacing: 1px; color: var(--muted); }
    .md-card.active .md-status { color: var(--gold); }
    .quick-ranking { }
    .quick-ranking h3 { font-size: 0.8rem; letter-spacing: 4px; color: var(--gold); margin-bottom: 0.75rem; }
    .ranking-table { width: 100%; border-collapse: collapse; margin-bottom: 1rem; }
    .ranking-table th { font-size: 0.65rem; letter-spacing: 2px; color: var(--muted); text-align: left; padding: 0.25rem 0.5rem; border-bottom: 1px solid var(--border); }
    .ranking-table td { padding: 0.5rem; border-bottom: 1px solid var(--border); font-size: 0.9rem; }
    .ranking-table .rank { color: var(--gold); font-weight: 900; width: 2rem; }
    .ranking-table .points { font-weight: 900; text-align: right; font-variant-numeric: tabular-nums; }
  `],
})
export class DashboardComponent {
  private matchdayService = inject(MatchdayService);
  private rankingService = inject(RankingService);

  competition = this.matchdayService.competition;
  allMatchdays = computed(() => this.matchdayService.getAll());
  activeMatchday = computed(() => this.matchdayService.getActive());
  globalRanking = computed(() =>
    this.rankingService.getGlobal()
  );

  statusClass(id: string): string {
    const md = this.matchdayService.getById(id);
    if (!md) return '';
    return this.matchdayService.getStatus(md).toLowerCase();
  }

  statusLabel(id: string): string {
    const md = this.matchdayService.getById(id);
    if (!md) return '';
    const s = this.matchdayService.getStatus(md);
    return ({ ACTIVE: 'ACTIVE', LOCKED: 'JOUÉ', UPCOMING: 'À VENIR' })[s];
  }
}
