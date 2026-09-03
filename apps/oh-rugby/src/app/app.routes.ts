import { Route } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const appRoutes: Route[] = [
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/dashboard/dashboard.component').then(
        (m) => m.DashboardComponent,
      ),
  },
  {
    path: 'matchday/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/matchday/matchday.component').then(
        (m) => m.MatchdayComponent,
      ),
  },
  {
    path: 'ranking',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/ranking/ranking.component').then(
        (m) => m.RankingComponent,
      ),
  },
  {
    // No guard: accessible to everyone, by design (see feat commit for /admin).
    path: 'admin',
    loadComponent: () =>
      import('./pages/admin/admin.component').then((m) => m.AdminComponent),
  },
  { path: '**', redirectTo: '' },
];
