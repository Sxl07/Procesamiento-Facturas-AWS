# Sprint 2 Review

## Objective
Implement real authentication and protected API access using Amazon Cognito, Angular, and Spring Boot.

## Delivered outcomes
- Cognito User Pool created through AWS CDK.
- Cognito App Client created through AWS CDK.
- Password policy configured.
- Optional MFA enabled.
- Initial Cognito groups defined:
  - `invoice-admins`
  - `invoice-users`
- Cognito hosted UI / web login flow configured with callback and logout URLs.
- Spring Boot backend configured as JWT resource server.
- JWT issuer validation enabled.
- Cognito access token validation implemented.
- Protected endpoint `/api/me` implemented.
- Angular frontend integrated with Cognito login flow.
- Session stored in browser session storage.
- HTTP interceptor configured to send bearer token.
- Login and logout flow working end-to-end.
- Frontend successfully calls `/api/me` with authenticated access token.

## Issues solved during the sprint
- Incorrect Cognito issuer values during local backend setup.
- Region mismatch between earlier stack usage and the active Cognito deployment.
- Angular standalone rendering issue caused by zone-related configuration.
- CORS policy blocking authenticated frontend-to-backend requests.

## Operational notes
- Local backend execution requires:
  - `COGNITO_ISSUER_URI`
  - `COGNITO_CLIENT_ID`
- `InvoiceAiPlatformDevStack` is now the active infrastructure reference for development.
- Legacy `InfraStack` should be reviewed later and removed if no longer needed.

## Conclusion
Sprint 2 is considered completed.
The project now has real authentication, token-based protected API access, and a working login/logout flow integrated across infrastructure, backend, and frontend.

## Next sprint
Sprint 3: secure invoice upload with presigned S3 URLs and initial invoice registration in DynamoDB.