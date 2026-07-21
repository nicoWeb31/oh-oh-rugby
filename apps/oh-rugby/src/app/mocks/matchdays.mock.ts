import { Match, Matchday, MatchOutcome } from '@org/models';

function matches(
  matchdayId: string,
  date: string,
  pairs: [string, string][]
): Match[] {
  return pairs.map(([home, away], i) => ({
    id: `${matchdayId}-m${i + 1}`,
    homeTeam: home,
    awayTeam: away,
    scheduledAt: date,
  }));
}

// J1–J3 : journées passées avec résultats (LOCKED)
// J4    : journée en cours (ACTIVE — semaine du lun. 21 juil. 2026)
// J5+   : journées à venir (UPCOMING)

const J1_MATCHES: Match[] = [
  { id: 'md1-m1', homeTeam: 'Bayonne',         awayTeam: 'Toulon',          scheduledAt: '2026-07-05', result: { outcome: MatchOutcome.HOME, offensiveBonusAwarded: false, defensiveBonusAwarded: false } },
  { id: 'md1-m2', homeTeam: 'Bordeaux-Bègles', awayTeam: 'Racing 92',       scheduledAt: '2026-07-05', result: { outcome: MatchOutcome.AWAY, offensiveBonusAwarded: false, defensiveBonusAwarded: false } },
  { id: 'md1-m3', homeTeam: 'Castres',          awayTeam: 'Vannes',          scheduledAt: '2026-07-05', result: { outcome: MatchOutcome.DRAW, offensiveBonusAwarded: false, defensiveBonusAwarded: false } },
  { id: 'md1-m4', homeTeam: 'La Rochelle',      awayTeam: 'Toulouse',        scheduledAt: '2026-07-05', result: { outcome: MatchOutcome.HOME, offensiveBonusAwarded: true,  defensiveBonusAwarded: false } },
  { id: 'md1-m5', homeTeam: 'Lyon',             awayTeam: 'Clermont',        scheduledAt: '2026-07-05', result: { outcome: MatchOutcome.HOME, offensiveBonusAwarded: false, defensiveBonusAwarded: true  } },
  { id: 'md1-m6', homeTeam: 'Montpellier',      awayTeam: 'Pau',             scheduledAt: '2026-07-05', result: { outcome: MatchOutcome.AWAY, offensiveBonusAwarded: false, defensiveBonusAwarded: false } },
  { id: 'md1-m7', homeTeam: 'Stade Français',   awayTeam: 'Perpignan',       scheduledAt: '2026-07-05', result: { outcome: MatchOutcome.HOME, offensiveBonusAwarded: false, defensiveBonusAwarded: false } },
];

const J2_MATCHES: Match[] = [
  { id: 'md2-m1', homeTeam: 'Perpignan',        awayTeam: 'Castres',         scheduledAt: '2026-07-12', result: { outcome: MatchOutcome.AWAY, offensiveBonusAwarded: false, defensiveBonusAwarded: false } },
  { id: 'md2-m2', homeTeam: 'Vannes',           awayTeam: 'Montpellier',     scheduledAt: '2026-07-12', result: { outcome: MatchOutcome.DRAW, offensiveBonusAwarded: false, defensiveBonusAwarded: false } },
  { id: 'md2-m3', homeTeam: 'Clermont',         awayTeam: 'Stade Français',  scheduledAt: '2026-07-12', result: { outcome: MatchOutcome.HOME, offensiveBonusAwarded: false, defensiveBonusAwarded: true  } },
  { id: 'md2-m4', homeTeam: 'Pau',              awayTeam: 'Bayonne',         scheduledAt: '2026-07-12', result: { outcome: MatchOutcome.AWAY, offensiveBonusAwarded: false, defensiveBonusAwarded: false } },
  { id: 'md2-m5', homeTeam: 'Racing 92',        awayTeam: 'Lyon',            scheduledAt: '2026-07-12', result: { outcome: MatchOutcome.HOME, offensiveBonusAwarded: false, defensiveBonusAwarded: true  } },
  { id: 'md2-m6', homeTeam: 'Toulon',           awayTeam: 'La Rochelle',     scheduledAt: '2026-07-12', result: { outcome: MatchOutcome.HOME, offensiveBonusAwarded: false, defensiveBonusAwarded: true  } },
  { id: 'md2-m7', homeTeam: 'Toulouse',         awayTeam: 'Bordeaux-Bègles', scheduledAt: '2026-07-12', result: { outcome: MatchOutcome.HOME, offensiveBonusAwarded: true,  defensiveBonusAwarded: false } },
];

const J3_MATCHES: Match[] = [
  { id: 'md3-m1', homeTeam: 'Bayonne',          awayTeam: 'Clermont',        scheduledAt: '2026-07-19', result: { outcome: MatchOutcome.DRAW, offensiveBonusAwarded: false, defensiveBonusAwarded: false } },
  { id: 'md3-m2', homeTeam: 'Bordeaux-Bègles',  awayTeam: 'Stade Français',  scheduledAt: '2026-07-19', result: { outcome: MatchOutcome.HOME, offensiveBonusAwarded: false, defensiveBonusAwarded: true  } },
  { id: 'md3-m3', homeTeam: 'Vannes',           awayTeam: 'Toulouse',        scheduledAt: '2026-07-19', result: { outcome: MatchOutcome.AWAY, offensiveBonusAwarded: true,  defensiveBonusAwarded: false } },
  { id: 'md3-m4', homeTeam: 'Castres',          awayTeam: 'Toulon',          scheduledAt: '2026-07-19', result: { outcome: MatchOutcome.HOME, offensiveBonusAwarded: false, defensiveBonusAwarded: true  } },
  { id: 'md3-m5', homeTeam: 'La Rochelle',      awayTeam: 'Racing 92',       scheduledAt: '2026-07-19', result: { outcome: MatchOutcome.HOME, offensiveBonusAwarded: false, defensiveBonusAwarded: false } },
  { id: 'md3-m6', homeTeam: 'Lyon',             awayTeam: 'Pau',             scheduledAt: '2026-07-19', result: { outcome: MatchOutcome.AWAY, offensiveBonusAwarded: false, defensiveBonusAwarded: true  } },
  { id: 'md3-m7', homeTeam: 'Montpellier',      awayTeam: 'Perpignan',       scheduledAt: '2026-07-19', result: { outcome: MatchOutcome.AWAY, offensiveBonusAwarded: false, defensiveBonusAwarded: false } },
];

export const MOCK_MATCHDAYS: Matchday[] = [
  { id: 'md1', label: 'J1',  date: '2026-07-05', matches: J1_MATCHES },
  { id: 'md2', label: 'J2',  date: '2026-07-12', matches: J2_MATCHES },
  { id: 'md3', label: 'J3',  date: '2026-07-19', matches: J3_MATCHES },
  { id: 'md4', label: 'J4',  date: '2026-07-26', matches: matches('md4',  '2026-07-26', [['Perpignan','Bordeaux-Bègles'],['Clermont','Castres'],['Stade Français','Lyon'],['Pau','La Rochelle'],['Racing 92','Bayonne'],['Toulon','Vannes'],['Toulouse','Montpellier']]) },
  { id: 'md5', label: 'J5',  date: '2026-08-02', matches: matches('md5',  '2026-08-02', [['Bayonne','Stade Français'],['Bordeaux-Bègles','Lyon'],['Vannes','Pau'],['Castres','Toulouse'],['La Rochelle','Clermont'],['Montpellier','Toulon'],['Racing 92','Perpignan']]) },
  { id: 'md6', label: 'J6',  date: '2026-08-09', matches: matches('md6',  '2026-08-09', [['Perpignan','Vannes'],['Clermont','Bordeaux-Bègles'],['Lyon','La Rochelle'],['Stade Français','Montpellier'],['Pau','Castres'],['Toulon','Racing 92'],['Toulouse','Bayonne']]) },
  { id: 'md7', label: 'J7',  date: '2026-08-16', matches: matches('md7',  '2026-08-16', [['Bayonne','Lyon'],['Vannes','Clermont'],['Castres','Stade Français'],['La Rochelle','Bordeaux-Bègles'],['Racing 92','Montpellier'],['Toulon','Pau'],['Toulouse','Perpignan']]) },
  { id: 'md8', label: 'J8',  date: '2026-08-23', matches: matches('md8',  '2026-08-23', [['Perpignan','Toulon'],['Bordeaux-Bègles','Bayonne'],['Clermont','Racing 92'],['Lyon','Vannes'],['Montpellier','Castres'],['Stade Français','La Rochelle'],['Pau','Toulouse']]) },
  { id: 'md9', label: 'J9',  date: '2026-08-30', matches: matches('md9',  '2026-08-30', [['Vannes','Bordeaux-Bègles'],['Castres','Racing 92'],['La Rochelle','Bayonne'],['Montpellier','Lyon'],['Pau','Perpignan'],['Toulon','Stade Français'],['Toulouse','Clermont']]) },
  { id: 'md10', label: 'J10', date: '2026-09-06', matches: matches('md10', '2026-09-06', [['Bayonne','Castres'],['Bordeaux-Bègles','Montpellier'],['Clermont','Toulon'],['La Rochelle','Perpignan'],['Lyon','Toulouse'],['Stade Français','Vannes'],['Racing 92','Pau']]) },
  { id: 'md11', label: 'J11', date: '2026-09-13', matches: matches('md11', '2026-09-13', [['Perpignan','Clermont'],['Vannes','Bayonne'],['Castres','Lyon'],['Montpellier','La Rochelle'],['Pau','Stade Français'],['Toulon','Bordeaux-Bègles'],['Toulouse','Racing 92']]) },
  { id: 'md12', label: 'J12', date: '2026-09-20', matches: matches('md12', '2026-09-20', [['Bayonne','Perpignan'],['Bordeaux-Bègles','Pau'],['Clermont','Montpellier'],['La Rochelle','Castres'],['Lyon','Toulon'],['Stade Français','Toulouse'],['Racing 92','Vannes']]) },
  { id: 'md13', label: 'J13', date: '2026-09-27', matches: matches('md13', '2026-09-27', [['Perpignan','Lyon'],['Vannes','La Rochelle'],['Castres','Bordeaux-Bègles'],['Montpellier','Bayonne'],['Pau','Clermont'],['Racing 92','Stade Français'],['Toulouse','Toulon']]) },
  { id: 'md14', label: 'J14', date: '2026-10-04', matches: matches('md14', '2026-10-04', [['Bayonne','Toulouse'],['Bordeaux-Bègles','Perpignan'],['Clermont','Vannes'],['La Rochelle','Pau'],['Lyon','Racing 92'],['Stade Français','Castres'],['Toulon','Montpellier']]) },
  { id: 'md15', label: 'J15', date: '2026-10-11', matches: matches('md15', '2026-10-11', [['Vannes','Perpignan'],['Castres','Clermont'],['Montpellier','Stade Français'],['Pau','Lyon'],['Racing 92','Bordeaux-Bègles'],['Toulon','Bayonne'],['Toulouse','La Rochelle']]) },
  { id: 'md16', label: 'J16', date: '2026-10-18', matches: matches('md16', '2026-10-18', [['Perpignan','Stade Français'],['Bordeaux-Bègles','Vannes'],['Clermont','Toulouse'],['La Rochelle','Toulon'],['Lyon','Bayonne'],['Pau','Montpellier'],['Racing 92','Castres']]) },
  { id: 'md17', label: 'J17', date: '2026-10-25', matches: matches('md17', '2026-10-25', [['Bayonne','La Rochelle'],['Perpignan','Pau'],['Vannes','Castres'],['Montpellier','Racing 92'],['Stade Français','Bordeaux-Bègles'],['Toulon','Clermont'],['Toulouse','Lyon']]) },
  { id: 'md18', label: 'J18', date: '2026-11-01', matches: matches('md18', '2026-11-01', [['Bordeaux-Bègles','Toulon'],['Castres','Perpignan'],['Clermont','Bayonne'],['La Rochelle','Stade Français'],['Lyon','Montpellier'],['Pau','Vannes'],['Racing 92','Toulouse']]) },
  { id: 'md19', label: 'J19', date: '2026-11-08', matches: matches('md19', '2026-11-08', [['Bayonne','Bordeaux-Bègles'],['Perpignan','Racing 92'],['Castres','La Rochelle'],['Montpellier','Clermont'],['Stade Français','Pau'],['Toulon','Lyon'],['Toulouse','Vannes']]) },
  { id: 'md20', label: 'J20', date: '2026-11-15', matches: matches('md20', '2026-11-15', [['Bayonne','Montpellier'],['Perpignan','La Rochelle'],['Bordeaux-Bègles','Toulouse'],['Vannes','Stade Français'],['Clermont','Pau'],['Lyon','Castres'],['Racing 92','Toulon']]) },
  { id: 'md21', label: 'J21', date: '2026-11-22', matches: matches('md21', '2026-11-22', [['Castres','Bayonne'],['La Rochelle','Vannes'],['Lyon','Perpignan'],['Montpellier','Bordeaux-Bègles'],['Stade Français','Clermont'],['Pau','Racing 92'],['Toulon','Toulouse']]) },
  { id: 'md22', label: 'J22', date: '2026-11-29', matches: matches('md22', '2026-11-29', [['Bayonne','Pau'],['Perpignan','Montpellier'],['Bordeaux-Bègles','La Rochelle'],['Vannes','Toulon'],['Clermont','Lyon'],['Stade Français','Racing 92'],['Toulouse','Castres']]) },
  { id: 'md23', label: 'J23', date: '2026-12-06', matches: matches('md23', '2026-12-06', [['Bayonne','Vannes'],['Clermont','Perpignan'],['Lyon','Stade Français'],['Montpellier','Toulouse'],['Pau','Bordeaux-Bègles'],['Racing 92','La Rochelle'],['Toulon','Castres']]) },
  { id: 'md24', label: 'J24', date: '2026-12-13', matches: matches('md24', '2026-12-13', [['Perpignan','Bayonne'],['Bordeaux-Bègles','Clermont'],['Vannes','Racing 92'],['Castres','Montpellier'],['La Rochelle','Lyon'],['Stade Français','Toulon'],['Toulouse','Pau']]) },
  { id: 'md25', label: 'J25', date: '2026-12-20', matches: matches('md25', '2026-12-20', [['Bayonne','Racing 92'],['Castres','Pau'],['Clermont','La Rochelle'],['Lyon','Bordeaux-Bègles'],['Montpellier','Vannes'],['Toulon','Perpignan'],['Toulouse','Stade Français']]) },
  { id: 'md26', label: 'J26', date: '2026-12-27', matches: matches('md26', '2026-12-27', [['Perpignan','Toulouse'],['Bordeaux-Bègles','Castres'],['Vannes','Lyon'],['La Rochelle','Montpellier'],['Stade Français','Bayonne'],['Pau','Toulon'],['Racing 92','Clermont']]) },
];

export const MOCK_COMPETITION = {
  id: 'comp1',
  name: 'TOP 14',
  season: '2026-2027',
  matchdayIds: MOCK_MATCHDAYS.map((md) => md.id),
  status: 'active' as const,
};
