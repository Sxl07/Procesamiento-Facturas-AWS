import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';

export interface TokenResponse {
  access_token: string;
  id_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in: number;
  scope?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);

  private readonly cognitoDomain = 'https://invoice-ai-platform-dev-auth-017601971421.auth.us-east-1.amazoncognito.com';
  private readonly clientId = '290dbnul3baj9as6ii45r29qoe';
  private readonly redirectUri = 'http://localhost:4200/auth/callback';
  private readonly logoutUri = 'http://localhost:4200/';
  private readonly apiBaseUrl = 'http://localhost:8080';

  login(): void {
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
        `&code_challenge=${encodeURIComponent(codeChallenge)}`;

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
    return sessionStorage.getItem('access_token');
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  logout(): void {
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('id_token');
    sessionStorage.removeItem('refresh_token');
    sessionStorage.removeItem('pkce_code_verifier');
    sessionStorage.removeItem('oauth_state');

    const logoutUrl =
      `${this.cognitoDomain}/logout` +
      `?client_id=${encodeURIComponent(this.clientId)}` +
      `&logout_uri=${encodeURIComponent(this.logoutUri)}`;

    window.location.href = logoutUrl;
  }

  getApiBaseUrl(): string {
    return this.apiBaseUrl;
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