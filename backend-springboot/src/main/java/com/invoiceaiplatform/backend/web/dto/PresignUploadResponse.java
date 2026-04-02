package com.invoiceaiplatform.backend.web.dto;

public class PresignUploadResponse {

    private final String invoiceId;
    private final String objectKey;
    private final String uploadUrl;
    private final long expiresInSeconds;

    public PresignUploadResponse(String invoiceId, String objectKey, String uploadUrl, long expiresInSeconds) {
        this.invoiceId = invoiceId;
        this.objectKey = objectKey;
        this.uploadUrl = uploadUrl;
        this.expiresInSeconds = expiresInSeconds;
    }

    public String getInvoiceId() {
        return invoiceId;
    }

    public String getObjectKey() {
        return objectKey;
    }

    public String getUploadUrl() {
        return uploadUrl;
    }

    public long getExpiresInSeconds() {
        return expiresInSeconds;
    }
}