package com.invoiceaiplatform.backend.security;

import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jwt.Jwt;

public class CognitoAccessTokenValidator implements OAuth2TokenValidator<Jwt> {

    private final String expectedClientId;

    public CognitoAccessTokenValidator(String expectedClientId) {
        this.expectedClientId = expectedClientId;
    }

    @Override
    public OAuth2TokenValidatorResult validate(Jwt jwt) {
        String tokenUse = jwt.getClaimAsString("token_use");
        String clientId = jwt.getClaimAsString("client_id");

        if (!"access".equals(tokenUse)) {
            return OAuth2TokenValidatorResult.failure(
                new OAuth2Error("invalid_token", "Token is not an access token", null)
            );
        }

        if (clientId == null || !clientId.equals(expectedClientId)) {
            return OAuth2TokenValidatorResult.failure(
                new OAuth2Error("invalid_token", "Token client_id does not match the expected Cognito app client", null)
            );
        }

        return OAuth2TokenValidatorResult.success();
    }
}