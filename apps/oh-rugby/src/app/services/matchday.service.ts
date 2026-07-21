import { Injectable } from '@angular/core';
import { Matchday, MatchdayStatus } from '@org/models';
import { MOCK_COMPETITION, MOCK_MATCHDAYS } from '../mocks/matchdays.mock';

@Injectable({ providedIn: 'root' })
export class MatchdayService {
  readonly competition = MOCK_COMPETITION;

  getAll(): Matchday[] {
    return MOCK_MATCHDAYS;
  }

  getById(id: string): Matchday | undefined {
    return MOCK_MATCHDAYS.find((md) => md.id === id);
  }

  getStatus(matchday: Matchday): MatchdayStatus {
    const now = new Date();
    const matchDate = new Date(matchday.date);
    const dayOfWeek = matchDate.getDay(); // 0=Sun, 6=Sat

    const monday = new Date(matchDate);
    monday.setDate(matchDate.getDate() - ((dayOfWeek + 6) % 7));
    monday.setHours(0, 0, 0, 0);

    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);
    friday.setHours(23, 59, 59, 999);

    if (now < monday) return MatchdayStatus.UPCOMING;
    if (now <= friday) return MatchdayStatus.ACTIVE;
    return MatchdayStatus.LOCKED;
  }

  getActive(): Matchday | undefined {
    return MOCK_MATCHDAYS.find(
      (md) => this.getStatus(md) === MatchdayStatus.ACTIVE
    );
  }
}
