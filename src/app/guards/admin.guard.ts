import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { of } from 'rxjs';

/**
 * Protege rutas que solo deben ser accesibles por usuarios con rol 'ADMIN'.
 */
export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    router.navigate(['/login']);
    return of(false);
  }

  const isAdmin = authService.hasRole('ADMIN');

  if (isAdmin) {
    return of(true);
  } else {
    router.navigate(['/']);
    return of(false);
  }
};
