package com.invoiceaiplatform.backend.web.dto;

public class RegisterInvoiceResponse {

    private final String invoiceId;
    private final String status;
    private final String message;

    public RegisterInvoiceResponse(String invoiceId, String status, String message) {
        this.invoiceId = invoiceId;
        this.status = status;
        this.message = message;
    }

    public String getInvoiceId() {
        return invoiceId;
    }

    public String getStatus() {
        return status;
    }

    public String getMessage() {
        return message;
    }
}