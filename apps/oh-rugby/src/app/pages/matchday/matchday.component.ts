import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Match, Matchday, MatchdayStatus, MatchOutcome, Prediction } from '@org/models';
import { MatchdayService } from '../../services/matchday.service';
import { PredictionService } from '../../services/prediction.service';
import { PlayerService } from '../../services/player.service';
import { ScoringService } from '../../services/scoring.service';
import { FormatDatePipe } from '../../pipes/format-date.pipe';

@Component({
  selector: 'app-matchday',
  imports: [RouterLink, FormsModule, FormatDatePipe],
  template: `
    @if (matchday()) {
      <div class="matchday-page">
        <div class="page-header">
          <a routerLink="/" class="back">← RETOUR</a>
          <div class="header-center">
            <span class="label">{{ matchday()!.label }}</span>
            <span class="status-badge" [class]="statusClass()">{{ statusLabel() }}</span>
          </div>
          <span class="date">{{ matchday()!.date | formatDate }}</span>
        </div>

        <div class="matches">
          @for (match of matchday()!.matches; track match.id) {
            <div class="match-card" [class.locked]="isLocked()">
              <div class="teams">
                <span class="team home" [class.winner]="match.result?.outcome === 'HOME'">
                  {{ match.homeTeam }}
                </span>
                <span class="vs">VS</span>
                <span class="team away" [class.winner]="match.result?.outcome === 'AWAY'">
                  {{ match.awayTeam }}
                </span>
              </div>

              @if (match.result) {
                <div class="result-row">
                  <span class="result-outcome">{{ outcomeLabel(match.result.outcome) }}</span>
                  @if (match.result.offensiveBonusAwarded) { <span class="bonus-tag">+OFF</span> }
                  @if (match.result.defensiveBonusAwarded) { <span class="bonus-tag">+DEF</span> }
                </div>
              }

              <div class="prediction-row">
                @if (!isLocked()) {
                  <div class="outcome-btns">
                    <button
                      class="outcome-btn"
                      [class.selected]="getPred(match.id)?.outcome === MO.HOME"
                      (click)="setPrediction(match.id, MO.HOME)">
                      DOM
                    </button>
                    <button
                      class="outcome-btn draw"
                      [class.selected]="getPred(match.id)?.outcome === MO.DRAW"
                      (click)="setPrediction(match.id, MO.DRAW)">
                      NUL
                    </button>
                    <button
                      class="outcome-btn"
                      [class.selected]="getPred(match.id)?.outcome === MO.AWAY"
                      (click)="setPrediction(match.id, MO.AWAY)">
                      EXT
                    </button>
                  </div>
                  @if (getPred(match.id)?.outcome) {
                    <div class="bonus-row">
                      <label class="bonus-check">
                        <input type="checkbox"
                          [checked]="getPred(match.id)?.offensiveBonusPredicted"
                          (change)="toggleBonus(match.id, 'off')">
                        B.OFF
                      </label>
                      <label class="bonus-check">
                        <input type="checkbox"
                          [checked]="getPred(match.id)?.defensiveBonusPredicted"
                          (change)="toggleBonus(match.id, 'def')">
                        B.DEF
                      </label>
                    </div>
                  }
                } @else {
                  <div class="pred-display" [class.correct]="isPredCorrect(match)">
                    @if (getPred(match.id)) {
                      <span class="pred-outcome">{{ outcomeLabel(getPred(match.id)!.outcome) }}</span>
                      @if (getPred(match.id)!.offensiveBonusPredicted) { <span class="bonus-tag pred">B.OFF</span> }
                      @if (getPred(match.id)!.defensiveBonusPredicted) { <span class="bonus-tag pred">B.DEF</span> }
                      <span class="match-pts">{{ matchScore(match) }} PTS</span>
                    } @else {
                      <span class="no-pred">—</span>
                    }
                  </div>
                }
              </div>
            </div>
          }
        </div>

        @if (!isLocked()) {
          <div class="save-bar">
            <button class="btn-primary" (click)="saveAll()">VALIDER MES PRONOSTICS</button>
            <span class="save-hint" [class.visible]="saved()">✓ SAUVEGARDÉ</span>
          </div>
        } @else if (isLocked() && hasResults()) {
          <div class="matchday-total">
            <span>MON TOTAL J{{ matchday()!.label.slice(1) }}</span>
            <span class="total-pts">{{ matchdayTotal() }} PTS</span>
          </div>
        }
      </div>
    } @else {
      <div class="not-found">JOURNÉE INTROUVABLE</div>
    }
  `,
  styles: [`
    .matchday-page { display: flex; flex-direction: column; gap: 1.5rem; }
    .page-header {
      display: flex; align-items: center; justify-content: space-between;
      border-bottom: 2px solid var(--gold); padding-bottom: 1rem;
    }
    .back { color: var(--muted); text-decoration: none; font-size: 0.75rem; letter-spacing: 2px; }
    .back:hover { color: var(--gold); }
    .header-center { display: flex; flex-direction: column; align-items: center; gap: 0.25rem; }
    .label { font-size: 2rem; font-weight: 900; color: var(--gold); }
    .date { font-size: 0.7rem; color: var(--muted); }
    .status-badge {
      font-size: 0.6rem; letter-spacing: 3px; padding: 2px 8px; font-weight: 700;
    }
    .status-badge.active { background: var(--gold); color: var(--bg); }
    .status-badge.locked { border: 1px solid var(--muted); color: var(--muted); }
    .status-badge.upcoming { border: 1px solid var(--border); color: var(--border); }

    .matches { display: flex; flex-direction: column; gap: 0.75rem; }
    .match-card {
      border: 1px solid var(--border); padding: 1rem;
      display: flex; flex-direction: column; gap: 0.75rem;
    }
    .match-card.locked { border-color: var(--border); }
    .teams {
      display: grid; grid-template-columns: 1fr auto 1fr;
      align-items: center; gap: 0.5rem;
    }
    .team { font-size: 0.85rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
    .team.home { text-align: right; }
    .team.away { text-align: left; }
    .team.winner { color: var(--gold); }
    .vs { font-size: 0.6rem; letter-spacing: 2px; color: var(--muted); text-align: center; }

    .result-row {
      display: flex; align-items: center; justify-content: center; gap: 0.5rem;
      font-size: 0.7rem;
    }
    .result-outcome { color: var(--muted); letter-spacing: 2px; }
    .bonus-tag { font-size: 0.6rem; background: var(--red); color: #fff; padding: 1px 5px; }
    .bonus-tag.pred { background: var(--border); }

    .prediction-row { display: flex; flex-direction: column; gap: 0.5rem; }
    .outcome-btns { display: flex; gap: 0.5rem; }
    .outcome-btn {
      flex: 1; padding: 0.5rem; font-size: 0.75rem; font-weight: 900; letter-spacing: 2px;
      background: transparent; border: 1px solid var(--border);
      color: var(--text); cursor: pointer; transition: all 0.1s;
    }
    .outcome-btn:hover { border-color: var(--gold); color: var(--gold); }
    .outcome-btn.selected { background: var(--gold); border-color: var(--gold); color: var(--bg); }
    .outcome-btn.draw.selected { background: var(--red); border-color: var(--red); color: #fff; }

    .bonus-row { display: flex; gap: 1rem; }
    .bonus-check {
      display: flex; align-items: center; gap: 0.4rem;
      font-size: 0.7rem; letter-spacing: 1px; cursor: pointer; color: var(--muted);
    }
    .bonus-check input { accent-color: var(--gold); }

    .pred-display {
      display: flex; align-items: center; gap: 0.5rem;
      font-size: 0.75rem; color: var(--muted);
    }
    .pred-display.correct { color: var(--gold); }
    .pred-outcome { font-weight: 700; letter-spacing: 2px; }
    .match-pts { margin-left: auto; font-weight: 900; font-variant-numeric: tabular-nums; }
    .no-pred { color: var(--muted); font-size: 1rem; }

    .save-bar {
      display: flex; align-items: center; gap: 1rem;
      border-top: 1px solid var(--border); padding-top: 1rem;
    }
    .save-hint { font-size: 0.75rem; color: var(--gold); opacity: 0; transition: opacity 0.3s; }
    .save-hint.visible { opacity: 1; }

    .matchday-total {
      display: flex; justify-content: space-between; align-items: center;
      border-top: 2px solid var(--gold); padding-top: 1rem;
      font-size: 0.8rem; letter-spacing: 2px;
    }
    .total-pts { font-size: 2rem; font-weight: 900; color: var(--gold); }
    .not-found { text-align: center; color: var(--muted); padding: 3rem; letter-spacing: 4px; }
  `],
})
export class MatchdayComponent {
  readonly id = input.required<string>();

  private matchdayService = inject(MatchdayService);
  private predictionService = inject(PredictionService);
  private playerService = inject(PlayerService);
  private scoringService = inject(ScoringService);

  saved = signal(false);
  readonly MO = MatchOutcome;

  matchday = computed(() => this.matchdayService.getById(this.id()));

  constructor() {
    effect(() => {
      const matchday = this.matchday();
      const player = this.playerService.currentPlayer();
      if (matchday && player) {
        this.predictionService.loadForMatchday(player.id, matchday.id);
      }
    });
  }
  status = computed(() => {
    const md = this.matchday();
    return md ? this.matchdayService.getStatus(md) : null;
  });

  isLocked = computed(() => {
    const s = this.status();
    return s === MatchdayStatus.LOCKED || s === MatchdayStatus.UPCOMING;
  });

  hasResults = computed(() =>
    this.matchday()?.matches.some((m) => m.result) ?? false
  );

  getPred(matchId: string): Prediction | undefined {
    const player = this.playerService.currentPlayer();
    if (!player) return undefined;
    return this.predictionService.getForPlayerAndMatch(
      player.id,
      matchId
    );
  }

  setPrediction(matchId: string, outcome: MatchOutcome): void {
    if (this.isLocked()) return;
    const player = this.playerService.currentPlayer();
    if (!player) return;
    const existing = this.getPred(matchId);
    this.predictionService.save({
      id: existing?.id ?? `pred-${player.id}-${matchId}`,
      playerId: player.id,
      matchId,
      outcome,
      offensiveBonusPredicted: existing?.offensiveBonusPredicted ?? false,
      defensiveBonusPredicted: existing?.defensiveBonusPredicted ?? false,
    });
    this.saved.set(false);
  }

  toggleBonus(matchId: string, type: 'off' | 'def'): void {
    if (this.isLocked()) return;
    const existing = this.getPred(matchId);
    if (!existing) return;
    this.predictionService.save({
      ...existing,
      offensiveBonusPredicted: type === 'off' ? !existing.offensiveBonusPredicted : existing.offensiveBonusPredicted,
      defensiveBonusPredicted: type === 'def' ? !existing.defensiveBonusPredicted : existing.defensiveBonusPredicted,
    });
  }

  saveAll(): void {
    this.saved.set(true);
    setTimeout(() => this.saved.set(false), 2500);
  }

  isPredCorrect(match: Match): boolean {
    const pred = this.getPred(match.id);
    return !!pred && !!match.result && pred.outcome === match.result.outcome;
  }

  matchScore(match: Match): number {
    const pred = this.getPred(match.id);
    if (!pred) return 0;
    return this.scoringService.scoreMatch(pred, match);
  }

  matchdayTotal = computed(() => {
    const md = this.matchday();
    if (!md) return 0;
    return md.matches.reduce((sum, match) => sum + this.matchScore(match), 0);
  });

  statusClass(): string {
    return this.status()?.toLowerCase() ?? '';
  }

  statusLabel(): string {
    const s = this.status();
    return s ? ({ ACTIVE: 'ACTIVE', LOCKED: 'JOUÉ', UPCOMING: 'À VENIR' })[s] : '';
  }

  outcomeLabel(outcome: MatchOutcome): string {
    return ({ HOME: 'DOMICILE', DRAW: 'NUL', AWAY: 'EXTÉRIEUR' })[outcome];
  }
}
