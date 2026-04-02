package com.invoiceaiplatform.backend.config;

import java.util.ArrayList;
import java.util.List;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.uploads")
public class UploadsProperties {

    private String bucketName;
    private String invoiceMetadataTable;
    private String uploadPrefix = "incoming/";
    private long maxFileSizeBytes = 10 * 1024 * 1024;
    private List<String> allowedContentTypes = new ArrayList<>();

    public String getBucketName() {
        return bucketName;
    }

    public void setBucketName(String bucketName) {
        this.bucketName = bucketName;
    }

    public String getInvoiceMetadataTable() {
        return invoiceMetadataTable;
    }

    public void setInvoiceMetadataTable(String invoiceMetadataTable) {
        this.invoiceMetadataTable = invoiceMetadataTable;
    }

    public String getUploadPrefix() {
        return uploadPrefix;
    }

    public void setUploadPrefix(String uploadPrefix) {
        this.uploadPrefix = uploadPrefix;
    }

    public long getMaxFileSizeBytes() {
        return maxFileSizeBytes;
    }

    public void setMaxFileSizeBytes(long maxFileSizeBytes) {
        this.maxFileSizeBytes = maxFileSizeBytes;
    }

    public List<String> getAllowedContentTypes() {
        return allowedContentTypes;
    }

    public void setAllowedContentTypes(List<String> allowedContentTypes) {
        this.allowedContentTypes = allowedContentTypes;
    }
}