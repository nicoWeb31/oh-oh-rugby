import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Match, MatchdayStatus, MatchOutcome } from '@org/models';
import { MatchdayService } from '../../services/matchday.service';
import { FormatDatePipe } from '../../pipes/format-date.pipe';

interface Draft {
  outcome: MatchOutcome | null;
  offensiveBonusAwarded: boolean;
  defensiveBonusAwarded: boolean;
}

@Component({
  selector: 'oh-rugby-admin',
  imports: [RouterLink, FormatDatePipe],
  template: `
    <div class="admin-page">
      <div class="page-header">
        <a routerLink="/" class="back">← RETOUR</a>
        <span class="label">ADMIN — RÉSULTATS</span>
      </div>

      @if (matchdaysToShow().length === 0) {
        <p class="empty">Aucune journée en cours ou terminée pour l'instant.</p>
      }

      @for (matchday of matchdaysToShow(); track matchday.id) {
        <section class="matchday-block">
          <div class="matchday-title">
            <span>{{ matchday.label }}</span>
            <span class="date">{{ matchday.date | formatDate }}</span>
          </div>

          @for (match of matchday.matches; track match.id) {
            <div class="match-row">
              <div class="teams">
                <span>{{ match.homeTeam }}</span>
                <span class="vs">VS</span>
                <span>{{ match.awayTeam }}</span>
              </div>

              <div class="outcome-btns">
                <button
                  class="outcome-btn"
                  [class.selected]="draft(match.id).outcome === MO.HOME"
                  (click)="setOutcome(match.id, MO.HOME)"
                >
                  DOM
                </button>
                <button
                  class="outcome-btn draw"
                  [class.selected]="draft(match.id).outcome === MO.DRAW"
                  (click)="setOutcome(match.id, MO.DRAW)"
                >
                  NUL
                </button>
                <button
                  class="outcome-btn"
                  [class.selected]="draft(match.id).outcome === MO.AWAY"
                  (click)="setOutcome(match.id, MO.AWAY)"
                >
                  EXT
                </button>
              </div>

              <div class="bonus-row">
                <label class="bonus-check">
                  <input
                    type="checkbox"
                    [checked]="draft(match.id).offensiveBonusAwarded"
                    (change)="toggleBonus(match.id, 'off')"
                  />
                  B.OFF
                </label>
                <label class="bonus-check">
                  <input
                    type="checkbox"
                    [checked]="draft(match.id).defensiveBonusAwarded"
                    (change)="toggleBonus(match.id, 'def')"
                  />
                  B.DEF
                </label>
                <button
                  class="btn-save"
                  [disabled]="!draft(match.id).outcome"
                  (click)="submit(match)"
                >
                  {{ match.result ? 'MODIFIER' : 'VALIDER' }}
                </button>
                @if (savedId() === match.id) {
                  <span class="saved-hint">✓</span>
                }
              </div>
            </div>
          }
        </section>
      }
    </div>
  `,
  styles: [
    `
      .admin-page {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
      }
      .page-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-bottom: 2px solid var(--gold);
        padding-bottom: 1rem;
      }
      .back {
        color: var(--muted);
        text-decoration: none;
        font-size: 0.75rem;
        letter-spacing: 2px;
      }
      .back:hover {
        color: var(--gold);
      }
      .label {
        font-size: 1rem;
        font-weight: 900;
        letter-spacing: 2px;
        color: var(--gold);
      }
      .empty {
        color: var(--muted);
        font-size: 0.85rem;
        text-align: center;
        padding: 2rem 0;
      }

      .matchday-block {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      .matchday-title {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        font-size: 0.9rem;
        font-weight: 900;
        letter-spacing: 2px;
        color: var(--gold);
      }
      .matchday-title .date {
        font-size: 0.65rem;
        color: var(--muted);
        font-weight: 400;
        letter-spacing: 1px;
      }

      .match-row {
        border: 1px solid var(--border);
        padding: 0.75rem;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      .teams {
        display: grid;
        grid-template-columns: 1fr auto 1fr;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.8rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 1px;
      }
      .teams span:first-child {
        text-align: right;
      }
      .teams span:last-child {
        text-align: left;
      }
      .vs {
        font-size: 0.6rem;
        letter-spacing: 2px;
        color: var(--muted);
        text-align: center;
      }

      .outcome-btns {
        display: flex;
        gap: 0.5rem;
      }
      .outcome-btn {
        flex: 1;
        padding: 0.4rem;
        font-size: 0.7rem;
        font-weight: 900;
        letter-spacing: 2px;
        background: transparent;
        border: 1px solid var(--border);
        color: var(--text);
        cursor: pointer;
      }
      .outcome-btn:hover {
        border-color: var(--gold);
        color: var(--gold);
      }
      .outcome-btn.selected {
        background: var(--gold);
        border-color: var(--gold);
        color: var(--bg);
      }
      .outcome-btn.draw.selected {
        background: var(--red);
        border-color: var(--red);
        color: #fff;
      }

      .bonus-row {
        display: flex;
        align-items: center;
        gap: 1rem;
      }
      .bonus-check {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        font-size: 0.65rem;
        letter-spacing: 1px;
        cursor: pointer;
        color: var(--muted);
      }
      .bonus-check input {
        accent-color: var(--gold);
      }
      .btn-save {
        margin-left: auto;
        padding: 0.35rem 0.75rem;
        font-size: 0.65rem;
        font-weight: 900;
        letter-spacing: 2px;
        background: var(--gold);
        color: var(--bg);
        border: none;
        cursor: pointer;
      }
      .btn-save:disabled {
        background: var(--border);
        color: var(--muted);
        cursor: not-allowed;
      }
      .saved-hint {
        color: var(--gold);
        font-weight: 900;
      }
    `,
  ],
})
export class AdminComponent {
  private readonly matchdayService = inject(MatchdayService);
  readonly MO = MatchOutcome;

  private readonly drafts = signal<Record<string, Draft>>({});
  savedId = signal<string | null>(null);

  matchdaysToShow = computed(() =>
    this.matchdayService
      .getAll()
      .filter(
        (matchday) =>
          this.matchdayService.getStatus(matchday) !== MatchdayStatus.UPCOMING,
      )
      .sort((a, b) => b.date.localeCompare(a.date)),
  );

  draft(matchId: string): Draft {
    const existing = this.drafts()[matchId];
    if (existing) return existing;

    const match = this.findMatch(matchId);
    return {
      outcome: match?.result?.outcome ?? null,
      offensiveBonusAwarded: match?.result?.offensiveBonusAwarded ?? false,
      defensiveBonusAwarded: match?.result?.defensiveBonusAwarded ?? false,
    };
  }

  setOutcome(matchId: string, outcome: MatchOutcome): void {
    this.updateDraft(matchId, { outcome });
  }

  toggleBonus(matchId: string, type: 'off' | 'def'): void {
    const current = this.draft(matchId);
    this.updateDraft(matchId, {
      offensiveBonusAwarded:
        type === 'off'
          ? !current.offensiveBonusAwarded
          : current.offensiveBonusAwarded,
      defensiveBonusAwarded:
        type === 'def'
          ? !current.defensiveBonusAwarded
          : current.defensiveBonusAwarded,
    });
  }

  submit(match: Match): void {
    const { outcome, offensiveBonusAwarded, defensiveBonusAwarded } =
      this.draft(match.id);
    if (!outcome) return;
    this.matchdayService.submitResult(
      match.id,
      { outcome, offensiveBonusAwarded, defensiveBonusAwarded },
      (success) => {
        if (!success) return;
        this.savedId.set(match.id);
        setTimeout(() => this.savedId.set(null), 2000);
      },
    );
  }

  private updateDraft(matchId: string, patch: Partial<Draft>): void {
    this.drafts.update((drafts) => ({
      ...drafts,
      [matchId]: { ...this.draft(matchId), ...patch },
    }));
  }

  private findMatch(matchId: string): Match | undefined {
    for (const matchday of this.matchdayService.getAll()) {
      const match = matchday.matches.find(
        (candidate) => candidate.id === matchId,
      );
      if (match) return match;
    }
    return undefined;
  }
}
