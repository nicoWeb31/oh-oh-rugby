import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Matchday, MatchdayStatus } from '@org/models';
import { MatchdayService } from '../../services/matchday.service';
import { RankingService } from '../../services/ranking.service';

@Component({
  selector: 'app-ranking',
  imports: [RouterLink],
  template: `
    <div class="ranking-page">
      <div class="page-header">
        <a routerLink="/" class="back">← RETOUR</a>
        <h2>CLASSEMENT</h2>
        <span></span>
      </div>

      <div class="tabs">
        <button class="tab" [class.active]="tab() === 'global'" (click)="tab.set('global')">GÉNÉRAL</button>
        @for (md of playedMatchdays(); track md.id) {
          <button class="tab" [class.active]="tab() === md.id" (click)="selectTab(md.id)">{{ md.label }}</button>
        }
      </div>

      <table class="leaderboard">
        <thead>
          <tr>
            <th>#</th>
            <th>JOUEUR</th>
            <th>PTS</th>
          </tr>
        </thead>
        <tbody>
          @for (entry of currentRanking(); track entry.playerId) {
            <tr [class.top1]="entry.rank === 1">
              <td class="rank">
                @if (entry.rank === 1) { 🥇 }
                @else if (entry.rank === 2) { 🥈 }
                @else if (entry.rank === 3) { 🥉 }
                @else { {{ entry.rank }} }
              </td>
              <td class="player-name">{{ entry.displayName }}</td>
              <td class="points">{{ entry.points }}</td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
  styles: [`
    .ranking-page { display: flex; flex-direction: column; gap: 1.5rem; }
    .page-header {
      display: flex; align-items: center; justify-content: space-between;
      border-bottom: 2px solid var(--gold); padding-bottom: 1rem;
    }
    .back { color: var(--muted); text-decoration: none; font-size: 0.75rem; letter-spacing: 2px; }
    .back:hover { color: var(--gold); }
    h2 { font-size: 1.5rem; font-weight: 900; letter-spacing: 6px; color: var(--gold); margin: 0; }

    .tabs {
      display: flex; flex-wrap: wrap; gap: 0.4rem;
      overflow-x: auto; padding-bottom: 0.25rem;
    }
    .tab {
      font-size: 0.65rem; font-weight: 900; letter-spacing: 2px;
      padding: 0.4rem 0.75rem; border: 1px solid var(--border);
      background: transparent; color: var(--muted); cursor: pointer;
    }
    .tab:hover { border-color: var(--gold); color: var(--gold); }
    .tab.active { background: var(--gold); border-color: var(--gold); color: var(--bg); }

    .leaderboard { width: 100%; border-collapse: collapse; }
    .leaderboard th {
      font-size: 0.65rem; letter-spacing: 3px; color: var(--muted);
      text-align: left; padding: 0.5rem; border-bottom: 1px solid var(--border);
    }
    .leaderboard td { padding: 0.9rem 0.5rem; border-bottom: 1px solid var(--border); }
    .leaderboard tr:last-child td { border-bottom: none; }
    .leaderboard tr.top1 { background: rgba(232,200,74,0.06); }

    .rank { font-size: 1.1rem; width: 2.5rem; }
    .player-name { font-size: 1.1rem; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; }
    .points {
      font-size: 1.8rem; font-weight: 900; color: var(--gold);
      text-align: right; font-variant-numeric: tabular-nums; letter-spacing: -1px;
    }
    .leaderboard tr.top1 .points { font-size: 2.2rem; }
  `],
})
export class RankingComponent {
  private matchdayService = inject(MatchdayService);
  private rankingService = inject(RankingService);

  tab = signal<string>('global');

  playedMatchdays = computed<Matchday[]>(() =>
    this.matchdayService.getAll().filter(
      (md) => this.matchdayService.getStatus(md) === MatchdayStatus.LOCKED
    )
  );

  currentRanking = computed(() => {
    if (this.tab() === 'global') {
      return this.rankingService.getGlobal();
    }
    return this.rankingService.getForMatchday(this.tab());
  });

  selectTab(matchdayId: string): void {
    this.tab.set(matchdayId);
    this.rankingService.loadForMatchday(matchdayId);
  }
}
