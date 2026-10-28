import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/login/login.component').then((m) => m.LoginComponent),
    canActivate: [guestGuard],
  },
  {
    path: '',
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then(
        (m) => m.DashboardComponent
      ),
    canActivate: [authGuard],
  },
  {
    path: 'builder',
    loadComponent: () =>
      import('./features/builder/builder.component').then(
        (m) => m.BuilderComponent
      ),
    canActivate: [authGuard],
  },
  {
    path: 'builder/:id',
    loadComponent: () =>
      import('./features/builder/builder.component').then(
        (m) => m.BuilderComponent
      ),
    canActivate: [authGuard],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
