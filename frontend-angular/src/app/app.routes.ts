import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Login } from './pages/login/login';
import { AuthCallback } from './pages/auth-callback/auth-callback';
import { authGuard } from './core/guards/auth-guard';

export const routes: Routes = [
  {
    path: '',
    component: Home,
  },
  {
    path: 'login',
    component: Login,
  },
  {
    path: 'auth/callback',
    component: AuthCallback,
  },
  {
    path: 'me',
    canActivate: [authGuard],
    component: Home,
  },
  {
    path: '**',
    redirectTo: '',
  },
];