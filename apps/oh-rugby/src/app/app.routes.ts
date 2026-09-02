import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/dashboard/dashboard.component').then((m) => m.DashboardComponent),
  },
  {
    path: 'matchday/:id',
    loadComponent: () =>
      import('./pages/matchday/matchday.component').then((m) => m.MatchdayComponent),
  },
  {
    path: 'ranking',
    loadComponent: () =>
      import('./pages/ranking/ranking.component').then((m) => m.RankingComponent),
  },
  {
    path: 'admin',
    loadComponent: () =>
      import('./pages/admin/admin.component').then((m) => m.AdminComponent),
  },
  { path: '**', redirectTo: '' },
];
