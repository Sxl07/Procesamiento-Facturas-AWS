package com.invoiceaiplatform.backend.service;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.invoiceaiplatform.backend.config.UploadsProperties;
import com.invoiceaiplatform.backend.web.dto.RegisterInvoiceRequest;
import com.invoiceaiplatform.backend.web.dto.RegisterInvoiceResponse;

import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;
import software.amazon.awssdk.services.dynamodb.model.ConditionalCheckFailedException;
import software.amazon.awssdk.services.dynamodb.model.PutItemRequest;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.HeadObjectRequest;
import software.amazon.awssdk.services.s3.model.NoSuchKeyException;

@Service
public class InvoiceRegistrationService {

    private static final String STATUS_UPLOADED = "UPLOADED";

    private final DynamoDbClient dynamoDbClient;
    private final S3Client s3Client;
    private final UploadsProperties uploadsProperties;

    public InvoiceRegistrationService(
            DynamoDbClient dynamoDbClient,
            S3Client s3Client,
            UploadsProperties uploadsProperties
    ) {
        this.dynamoDbClient = dynamoDbClient;
        this.s3Client = s3Client;
        this.uploadsProperties = uploadsProperties;
    }

    public RegisterInvoiceResponse registerInvoice(String userId, RegisterInvoiceRequest request) {
        validateRequest(userId, request);
        ensureObjectExists(request.getObjectKey());

        String now = Instant.now().toString();

        Map<String, AttributeValue> item = new HashMap<>();
        item.put("invoiceId", AttributeValue.builder().s(request.getInvoiceId()).build());
        item.put("userId", AttributeValue.builder().s(userId).build());
        item.put("originalFileName", AttributeValue.builder().s(request.getOriginalFileName()).build());
        item.put("storedObjectKey", AttributeValue.builder().s(request.getObjectKey()).build());
        item.put("bucket", AttributeValue.builder().s(uploadsProperties.getBucketName()).build());
        item.put("contentType", AttributeValue.builder().s(request.getContentType()).build());
        item.put("sizeBytes", AttributeValue.builder().n(Long.toString(request.getSizeBytes())).build());
        item.put("status", AttributeValue.builder().s(STATUS_UPLOADED).build());
        item.put("createdAt", AttributeValue.builder().s(now).build());
        item.put("updatedAt", AttributeValue.builder().s(now).build());

        PutItemRequest putItemRequest = PutItemRequest.builder()
                .tableName(uploadsProperties.getInvoiceMetadataTable())
                .item(item)
                .conditionExpression("attribute_not_exists(invoiceId)")
                .build();

        try {
            dynamoDbClient.putItem(putItemRequest);
        } catch (ConditionalCheckFailedException ex) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Invoice is already registered"
            );
        }

        return new RegisterInvoiceResponse(
                request.getInvoiceId(),
                STATUS_UPLOADED,
                "Invoice registered successfully"
        );
    }

    private void validateRequest(String userId, RegisterInvoiceRequest request) {
        if (!uploadsProperties.getAllowedContentTypes().contains(request.getContentType())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Unsupported content type"
            );
        }

        if (request.getSizeBytes() > uploadsProperties.getMaxFileSizeBytes()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "File exceeds maximum allowed size"
            );
        }

        if (!request.getOriginalFileName().toLowerCase().endsWith(".pdf")) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Only PDF files are allowed"
            );
        }

        String expectedPrefix = normalizePrefix(uploadsProperties.getUploadPrefix()) + userId + "/";
        if (!request.getObjectKey().startsWith(expectedPrefix)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Object key does not belong to the authenticated user"
            );
        }

        String expectedKey = expectedPrefix + request.getInvoiceId() + ".pdf";
        if (!request.getObjectKey().equals(expectedKey)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Object key does not match the expected invoice key"
            );
        }
    }

    private void ensureObjectExists(String objectKey) {
        try {
            s3Client.headObject(HeadObjectRequest.builder()
                    .bucket(uploadsProperties.getBucketName())
                    .key(objectKey)
                    .build());
        } catch (NoSuchKeyException ex) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Uploaded object was not found in S3"
            );
        } catch (Exception ex) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Unable to validate uploaded object in S3"
            );
        }
    }

    private String normalizePrefix(String prefix) {
        return prefix.endsWith("/") ? prefix : prefix + "/";
    }
}