package com.invoiceaiplatform.backend.web;

import jakarta.validation.Valid;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.invoiceaiplatform.backend.service.InvoiceRegistrationService;
import com.invoiceaiplatform.backend.web.dto.RegisterInvoiceRequest;
import com.invoiceaiplatform.backend.web.dto.RegisterInvoiceResponse;

@RestController
@RequestMapping("/api/invoices")
public class InvoiceController {

    private final InvoiceRegistrationService invoiceRegistrationService;

    public InvoiceController(InvoiceRegistrationService invoiceRegistrationService) {
        this.invoiceRegistrationService = invoiceRegistrationService;
    }

    @PostMapping("/register")
    public RegisterInvoiceResponse registerInvoice(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody RegisterInvoiceRequest request
    ) {
        String userId = jwt.getSubject();
        return invoiceRegistrationService.registerInvoice(userId, request);
    }
}