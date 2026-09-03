import { Matchday } from '@org/models';

function matches(
  matchdayId: string,
  date: string,
  pairs: [string, string][]
) {
  return pairs.map(([home, away], i) => ({
    id: `${matchdayId}-m${i + 1}`,
    homeTeam: home,
    awayTeam: away,
    scheduledAt: date,
  }));
}

// Calendrier réel TOP 14 2026-2027 (voir SPEC.md). Aucun résultat saisi :
// le championnat n'a pas encore commencé.
export const MOCK_MATCHDAYS: Matchday[] = [
  { id: 'md1', label: 'J1', date: '2026-09-05', matches: matches('md1', '2026-09-05', [['Bayonne', 'Toulon'], ['Bordeaux-Bègles', 'Racing 92'], ['Castres', 'Vannes'], ['La Rochelle', 'Toulouse'], ['Lyon', 'Clermont'], ['Montpellier', 'Pau'], ['Stade Français', 'Perpignan']]) },
  { id: 'md2', label: 'J2', date: '2026-09-12', matches: matches('md2', '2026-09-12', [['Perpignan', 'Castres'], ['Vannes', 'Montpellier'], ['Clermont', 'Stade Français'], ['Pau', 'Bayonne'], ['Racing 92', 'Lyon'], ['Toulon', 'La Rochelle'], ['Toulouse', 'Bordeaux-Bègles']]) },
  { id: 'md3', label: 'J3', date: '2026-09-19', matches: matches('md3', '2026-09-19', [['Bayonne', 'Clermont'], ['Bordeaux-Bègles', 'Stade Français'], ['Vannes', 'Toulouse'], ['Castres', 'Toulon'], ['La Rochelle', 'Racing 92'], ['Lyon', 'Pau'], ['Montpellier', 'Perpignan']]) },
  { id: 'md4', label: 'J4', date: '2026-09-26', matches: matches('md4', '2026-09-26', [['Perpignan', 'Bordeaux-Bègles'], ['Clermont', 'Castres'], ['Stade Français', 'Lyon'], ['Pau', 'La Rochelle'], ['Racing 92', 'Bayonne'], ['Toulon', 'Vannes'], ['Toulouse', 'Montpellier']]) },
  { id: 'md5', label: 'J5', date: '2026-10-03', matches: matches('md5', '2026-10-03', [['Bayonne', 'Stade Français'], ['Bordeaux-Bègles', 'Lyon'], ['Vannes', 'Pau'], ['Castres', 'Toulouse'], ['La Rochelle', 'Clermont'], ['Montpellier', 'Toulon'], ['Racing 92', 'Perpignan']]) },
  { id: 'md6', label: 'J6', date: '2026-10-10', matches: matches('md6', '2026-10-10', [['Perpignan', 'Vannes'], ['Clermont', 'Bordeaux-Bègles'], ['Lyon', 'La Rochelle'], ['Stade Français', 'Montpellier'], ['Pau', 'Castres'], ['Toulon', 'Racing 92'], ['Toulouse', 'Bayonne']]) },
  { id: 'md7', label: 'J7', date: '2026-10-24', matches: matches('md7', '2026-10-24', [['Bayonne', 'Lyon'], ['Vannes', 'Clermont'], ['Castres', 'Stade Français'], ['La Rochelle', 'Bordeaux-Bègles'], ['Racing 92', 'Montpellier'], ['Toulon', 'Pau'], ['Toulouse', 'Perpignan']]) },
  { id: 'md8', label: 'J8', date: '2026-10-31', matches: matches('md8', '2026-10-31', [['Perpignan', 'Toulon'], ['Bordeaux-Bègles', 'Bayonne'], ['Clermont', 'Racing 92'], ['Lyon', 'Vannes'], ['Montpellier', 'Castres'], ['Stade Français', 'La Rochelle'], ['Pau', 'Toulouse']]) },
  { id: 'md9', label: 'J9', date: '2026-11-07', matches: matches('md9', '2026-11-07', [['Vannes', 'Bordeaux-Bègles'], ['Castres', 'Racing 92'], ['La Rochelle', 'Bayonne'], ['Montpellier', 'Lyon'], ['Pau', 'Perpignan'], ['Toulon', 'Stade Français'], ['Toulouse', 'Clermont']]) },
  { id: 'md10', label: 'J10', date: '2026-11-28', matches: matches('md10', '2026-11-28', [['Bayonne', 'Castres'], ['Bordeaux-Bègles', 'Montpellier'], ['Clermont', 'Toulon'], ['La Rochelle', 'Perpignan'], ['Lyon', 'Toulouse'], ['Stade Français', 'Vannes'], ['Racing 92', 'Pau']]) },
  { id: 'md11', label: 'J11', date: '2026-12-05', matches: matches('md11', '2026-12-05', [['Perpignan', 'Clermont'], ['Vannes', 'Bayonne'], ['Castres', 'Lyon'], ['Montpellier', 'La Rochelle'], ['Pau', 'Stade Français'], ['Toulon', 'Bordeaux-Bègles'], ['Toulouse', 'Racing 92']]) },
  { id: 'md12', label: 'J12', date: '2026-12-19', matches: matches('md12', '2026-12-19', [['Bayonne', 'Perpignan'], ['Bordeaux-Bègles', 'Pau'], ['Clermont', 'Montpellier'], ['La Rochelle', 'Castres'], ['Lyon', 'Toulon'], ['Stade Français', 'Toulouse'], ['Racing 92', 'Vannes']]) },
  { id: 'md13', label: 'J13', date: '2026-12-26', matches: matches('md13', '2026-12-26', [['Perpignan', 'Lyon'], ['Vannes', 'La Rochelle'], ['Castres', 'Bordeaux-Bègles'], ['Montpellier', 'Bayonne'], ['Pau', 'Clermont'], ['Racing 92', 'Stade Français'], ['Toulouse', 'Toulon']]) },
  { id: 'md14', label: 'J14', date: '2027-01-02', matches: matches('md14', '2027-01-02', [['Bayonne', 'Toulouse'], ['Bordeaux-Bègles', 'Perpignan'], ['Clermont', 'Vannes'], ['La Rochelle', 'Pau'], ['Lyon', 'Racing 92'], ['Stade Français', 'Castres'], ['Toulon', 'Montpellier']]) },
  { id: 'md15', label: 'J15', date: '2027-01-23', matches: matches('md15', '2027-01-23', [['Vannes', 'Perpignan'], ['Castres', 'Clermont'], ['Montpellier', 'Stade Français'], ['Pau', 'Lyon'], ['Racing 92', 'Bordeaux-Bègles'], ['Toulon', 'Bayonne'], ['Toulouse', 'La Rochelle']]) },
  { id: 'md16', label: 'J16', date: '2027-01-30', matches: matches('md16', '2027-01-30', [['Perpignan', 'Stade Français'], ['Bordeaux-Bègles', 'Vannes'], ['Clermont', 'Toulouse'], ['La Rochelle', 'Toulon'], ['Lyon', 'Bayonne'], ['Pau', 'Montpellier'], ['Racing 92', 'Castres']]) },
  { id: 'md17', label: 'J17', date: '2027-02-20', matches: matches('md17', '2027-02-20', [['Bayonne', 'La Rochelle'], ['Perpignan', 'Pau'], ['Vannes', 'Castres'], ['Montpellier', 'Racing 92'], ['Stade Français', 'Bordeaux-Bègles'], ['Toulon', 'Clermont'], ['Toulouse', 'Lyon']]) },
  { id: 'md18', label: 'J18', date: '2027-02-27', matches: matches('md18', '2027-02-27', [['Bordeaux-Bègles', 'Toulon'], ['Castres', 'Perpignan'], ['Clermont', 'Bayonne'], ['La Rochelle', 'Stade Français'], ['Lyon', 'Montpellier'], ['Pau', 'Vannes'], ['Racing 92', 'Toulouse']]) },
  { id: 'md19', label: 'J19', date: '2027-03-20', matches: matches('md19', '2027-03-20', [['Bayonne', 'Bordeaux-Bègles'], ['Perpignan', 'Racing 92'], ['Castres', 'La Rochelle'], ['Montpellier', 'Clermont'], ['Stade Français', 'Pau'], ['Toulon', 'Lyon'], ['Toulouse', 'Vannes']]) },
  { id: 'md20', label: 'J20', date: '2027-03-27', matches: matches('md20', '2027-03-27', [['Bayonne', 'Montpellier'], ['Perpignan', 'La Rochelle'], ['Bordeaux-Bègles', 'Toulouse'], ['Vannes', 'Stade Français'], ['Clermont', 'Pau'], ['Lyon', 'Castres'], ['Racing 92', 'Toulon']]) },
  { id: 'md21', label: 'J21', date: '2027-04-17', matches: matches('md21', '2027-04-17', [['Castres', 'Bayonne'], ['La Rochelle', 'Vannes'], ['Lyon', 'Perpignan'], ['Montpellier', 'Bordeaux-Bègles'], ['Stade Français', 'Clermont'], ['Pau', 'Racing 92'], ['Toulon', 'Toulouse']]) },
  { id: 'md22', label: 'J22', date: '2027-04-24', matches: matches('md22', '2027-04-24', [['Bayonne', 'Pau'], ['Perpignan', 'Montpellier'], ['Bordeaux-Bègles', 'La Rochelle'], ['Vannes', 'Toulon'], ['Clermont', 'Lyon'], ['Stade Français', 'Racing 92'], ['Toulouse', 'Castres']]) },
  { id: 'md23', label: 'J23', date: '2027-05-08', matches: matches('md23', '2027-05-08', [['Bayonne', 'Vannes'], ['Clermont', 'Perpignan'], ['Lyon', 'Stade Français'], ['Montpellier', 'Toulouse'], ['Pau', 'Bordeaux-Bègles'], ['Racing 92', 'La Rochelle'], ['Toulon', 'Castres']]) },
  { id: 'md24', label: 'J24', date: '2027-05-15', matches: matches('md24', '2027-05-15', [['Perpignan', 'Bayonne'], ['Bordeaux-Bègles', 'Clermont'], ['Vannes', 'Racing 92'], ['Castres', 'Montpellier'], ['La Rochelle', 'Lyon'], ['Stade Français', 'Toulon'], ['Toulouse', 'Pau']]) },
  { id: 'md25', label: 'J25', date: '2027-05-29', matches: matches('md25', '2027-05-29', [['Bayonne', 'Racing 92'], ['Castres', 'Pau'], ['Clermont', 'La Rochelle'], ['Lyon', 'Bordeaux-Bègles'], ['Montpellier', 'Vannes'], ['Toulon', 'Perpignan'], ['Toulouse', 'Stade Français']]) },
  { id: 'md26', label: 'J26', date: '2027-06-05', matches: matches('md26', '2027-06-05', [['Perpignan', 'Toulouse'], ['Bordeaux-Bègles', 'Castres'], ['Vannes', 'Lyon'], ['La Rochelle', 'Montpellier'], ['Stade Français', 'Bayonne'], ['Pau', 'Toulon'], ['Racing 92', 'Clermont']]) },
];

export const MOCK_COMPETITION = {
  id: 'comp1',
  name: 'TOP 14',
  season: '2026-2027',
  matchdayIds: MOCK_MATCHDAYS.map((md) => md.id),
  status: 'active' as const,
};
