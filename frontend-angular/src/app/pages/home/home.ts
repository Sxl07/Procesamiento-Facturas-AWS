import { Component, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { JsonPipe, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.html',
  imports: [NgIf, JsonPipe, RouterLink],
})
export class Home {
  private readonly http = inject(HttpClient);
  protected readonly authService = inject(AuthService);

  protected meResponse: unknown = null;
  protected errorMessage = '';

  callMe(): void {
    this.errorMessage = '';
    this.http.get(`${this.authService.getApiBaseUrl()}/api/me`).subscribe({
      next: (response) => {
        this.meResponse = response;
      },
      error: (error) => {
        this.meResponse = null;
        this.errorMessage = `Error calling /api/me: ${error.status}`;
      },
    });
  }

  logout(): void {
    this.authService.logout();
  }
}