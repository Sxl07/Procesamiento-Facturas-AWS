# Authentication Flow

## Objective
Describe the end-to-end authentication flow implemented in Sprint 2.

## Components
- Amazon Cognito User Pool
- Cognito App Client
- Cognito hosted UI / managed login
- Angular frontend
- Spring Boot backend as JWT resource server

## Login flow
1. The user opens the Angular frontend.
2. The user clicks the login button.
3. The frontend redirects the browser to the Cognito `/oauth2/authorize` endpoint.
4. Cognito authenticates the user with managed login.
5. Cognito redirects the browser back to:
   - `http://localhost:4200/auth/callback`
6. The frontend exchanges the authorization code for tokens at the Cognito `/oauth2/token` endpoint.
7. The frontend stores the access token and ID token in `sessionStorage`.
8. The frontend sends the access token as `Authorization: Bearer <token>` when calling protected backend endpoints.

## Backend validation
The Spring Boot backend validates:
- JWT issuer
- Cognito app client
- token type (`token_use=access`)

Protected endpoint available in Sprint 2:
- `GET /api/me`

## Logout flow
1. The frontend clears the local session data.
2. The frontend redirects the browser to the Cognito `/logout` endpoint.
3. Cognito redirects the browser back to:
   - `http://localhost:4200/`

## Notes
- The frontend uses a public Cognito app client with no client secret.
- Group membership is exposed in the token through `cognito:groups`.
- Current functional groups:
  - `invoice-users`
  - `invoice-admins`