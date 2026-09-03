import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PlayerService } from '../services/player.service';

// Not real security — the codes are checked server-side on every write that
// matters. This only spares an already-logged-out visitor from seeing pages
// meant for players before they've entered their code.
export const authGuard: CanActivateFn = () => {
  const playerService = inject(PlayerService);
  const router = inject(Router);

  if (playerService.hasStoredAuth() || playerService.currentPlayer())
    return true;
  return router.parseUrl('/login');
};
