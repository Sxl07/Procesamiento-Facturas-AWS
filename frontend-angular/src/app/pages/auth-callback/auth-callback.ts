import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-auth-callback',
  templateUrl: './auth-callback.html',
})
export class AuthCallback implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  ngOnInit(): void {
    const code = this.route.snapshot.queryParamMap.get('code');
    const state = this.route.snapshot.queryParamMap.get('state');

    if (!code) {
      this.router.navigate(['/login']);
      return;
    }

    try {
      this.authService.exchangeCodeForTokens(code, state).subscribe({
        next: (tokens) => {
          this.authService.storeTokens(tokens);
          this.router.navigate(['/']);
        },
        error: () => {
          this.router.navigate(['/login']);
        },
      });
    } catch {
      this.router.navigate(['/login']);
    }
  }
}