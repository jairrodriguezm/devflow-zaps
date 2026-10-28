import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly apiBase = 'http://localhost:3000/api/auth';

  readonly currentUser = signal<User | null>(null);
  readonly isAuthenticated = computed(() => !!this.currentUser());
  readonly isLoading = signal<boolean>(true);

  constructor() {
    this.checkAuthStatus();
  }

  /**
   * Validates current authentication status against backend.
   * Also captures and stores URL token parameter if coming back from GitHub OAuth redirect.
   */
  async checkAuthStatus(): Promise<boolean> {
    this.isLoading.set(true);

    try {
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const tokenFromUrl = urlParams.get('token');
        if (tokenFromUrl) {
          localStorage.setItem('devflow_token', tokenFromUrl);
          // Clean URL parameter without triggering full page reload
          const cleanUrl = window.location.pathname;
          window.history.replaceState({}, document.title, cleanUrl);
        }
      }

      const user = await firstValueFrom(
        this.http.get<User>(`${this.apiBase}/me`)
      );

      this.currentUser.set(user);
      return true;
    } catch {
      this.currentUser.set(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('devflow_token');
      }
      return false;
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Performs a full browser window navigation to initiate GitHub OAuth authorization flow.
   * Note: Must NOT be an AJAX/HttpClient request to avoid CORS blocking 302 redirects to external domains.
   */
  loginWithGitHub(): void {
    if (typeof window !== 'undefined') {
      window.location.href = `${this.apiBase}/github`;
    }
  }

  /**
   * Clears server session cookie and local state, then navigates to login view.
   */
  async logout(): Promise<void> {
    try {
      await firstValueFrom(this.http.post(`${this.apiBase}/logout`, {}));
    } catch (err) {
      console.warn('Logout API error:', err);
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('devflow_token');
      }
      this.currentUser.set(null);
      this.router.navigate(['/login']);
    }
  }
}
