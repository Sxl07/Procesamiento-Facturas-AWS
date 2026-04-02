import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { authConfig } from '../config/auth.config';

export interface TokenResponse {
  access_token: string;
  id_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in: number;
  scope?: string;
}

interface JwtPayload {
  exp?: number;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);

  private readonly cognitoDomain = authConfig.cognitoDomain;
  private readonly clientId = authConfig.clientId;
  private readonly redirectUri = authConfig.redirectUri;
  private readonly logoutUri = authConfig.logoutUri;
  private readonly apiBaseUrl = authConfig.apiBaseUrl;

  login(): void {
    this.clearTransientAuthState();

    const codeVerifier = this.generateRandomString(64);
    const state = this.generateRandomString(32);

    sessionStorage.setItem('pkce_code_verifier', codeVerifier);
    sessionStorage.setItem('oauth_state', state);

    this.createCodeChallenge(codeVerifier).then((codeChallenge) => {
      const authorizeUrl =
        `${this.cognitoDomain}/oauth2/authorize` +
        `?response_type=code` +
        `&client_id=${encodeURIComponent(this.clientId)}` +
        `&redirect_uri=${encodeURIComponent(this.redirectUri)}` +
        `&scope=${encodeURIComponent('openid email profile')}` +
        `&state=${encodeURIComponent(state)}` +
        `&code_challenge_method=S256` +
        `&code_challenge=${encodeURIComponent(codeChallenge)}` +
        `&prompt=login`;

      window.location.href = authorizeUrl;
    });
  }

  exchangeCodeForTokens(code: string, state: string | null) {
    const storedState = sessionStorage.getItem('oauth_state');
    const codeVerifier = sessionStorage.getItem('pkce_code_verifier');

    if (!storedState || !state || storedState !== state) {
      throw new Error('Invalid OAuth state');
    }

    if (!codeVerifier) {
      throw new Error('Missing PKCE code verifier');
    }

    const body = new HttpParams()
      .set('grant_type', 'authorization_code')
      .set('client_id', this.clientId)
      .set('code', code)
      .set('redirect_uri', this.redirectUri)
      .set('code_verifier', codeVerifier);

    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded',
    });

    return this.http.post<TokenResponse>(
      `${this.cognitoDomain}/oauth2/token`,
      body.toString(),
      { headers }
    );
  }

  storeTokens(tokens: TokenResponse): void {
    sessionStorage.setItem('access_token', tokens.access_token);
    sessionStorage.setItem('id_token', tokens.id_token);

    if (tokens.refresh_token) {
      sessionStorage.setItem('refresh_token', tokens.refresh_token);
    }

    sessionStorage.removeItem('pkce_code_verifier');
    sessionStorage.removeItem('oauth_state');
  }

  getAccessToken(): string | null {
    const token = sessionStorage.getItem('access_token');

    if (!token) {
      return null;
    }

    if (this.isTokenExpired(token)) {
      this.clearSession();
      return null;
    }

    return token;
  }

  isAuthenticated(): boolean {
    return this.getAccessToken() !== null;
  }

  logout(): void {
    this.clearSession();

    const logoutUrl =
      `${this.cognitoDomain}/logout` +
      `?client_id=${encodeURIComponent(this.clientId)}` +
      `&logout_uri=${encodeURIComponent(this.logoutUri)}`;

    window.location.href = logoutUrl;
  }

  getApiBaseUrl(): string {
    return this.apiBaseUrl;
  }

  clearSession(): void {
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('id_token');
    sessionStorage.removeItem('refresh_token');
    sessionStorage.removeItem('pkce_code_verifier');
    sessionStorage.removeItem('oauth_state');
  }

  private clearTransientAuthState(): void {
    sessionStorage.removeItem('pkce_code_verifier');
    sessionStorage.removeItem('oauth_state');
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = this.parseJwtPayload(token);
      if (!payload?.exp) {
        return true;
      }

      const nowInSeconds = Math.floor(Date.now() / 1000);
      return payload.exp <= nowInSeconds;
    } catch {
      return true;
    }
  }

  private parseJwtPayload(token: string): JwtPayload | null {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const json = atob(padded);

    return JSON.parse(json) as JwtPayload;
  }

  private generateRandomString(length: number): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    const values = crypto.getRandomValues(new Uint8Array(length));
    return Array.from(values)
      .map((v) => charset[v % charset.length])
      .join('');
  }

  private async createCodeChallenge(codeVerifier: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    const digest = await crypto.subtle.digest('SHA-256', data);

    return btoa(String.fromCharCode(...new Uint8Array(digest)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }
}