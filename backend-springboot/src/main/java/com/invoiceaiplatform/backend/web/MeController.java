package com.invoiceaiplatform.backend.web;

import java.util.List;
import java.util.Map;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class MeController {

    @GetMapping("/api/me")
    public Map<String, Object> me(@AuthenticationPrincipal Jwt jwt) {
        List<String> groups = jwt.getClaimAsStringList("cognito:groups");
        if (groups == null) {
            groups = List.of();
        }

        return Map.of(
            "sub", jwt.getSubject(),
            "username", jwt.getClaimAsString("username"),
            "clientId", jwt.getClaimAsString("client_id"),
            "groups", groups,
            "tokenUse", jwt.getClaimAsString("token_use")
        );
    }
}