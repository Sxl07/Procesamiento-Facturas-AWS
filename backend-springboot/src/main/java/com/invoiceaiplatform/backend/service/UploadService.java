package com.invoiceaiplatform.backend.service;

import java.time.Duration;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.invoiceaiplatform.backend.config.UploadsProperties;
import com.invoiceaiplatform.backend.web.dto.PresignUploadRequest;
import com.invoiceaiplatform.backend.web.dto.PresignUploadResponse;

import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.PresignedPutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

@Service
public class UploadService {

    private static final long PRESIGNED_URL_EXPIRATION_SECONDS = 300L;

    private final S3Presigner s3Presigner;
    private final UploadsProperties uploadsProperties;

    public UploadService(S3Presigner s3Presigner, UploadsProperties uploadsProperties) {
        this.s3Presigner = s3Presigner;
        this.uploadsProperties = uploadsProperties;
    }

    public PresignUploadResponse createPresignedUpload(String userId, PresignUploadRequest request) {
        validateRequest(request);

        String invoiceId = UUID.randomUUID().toString();
        String objectKey = buildObjectKey(userId, invoiceId);

        PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                .bucket(uploadsProperties.getBucketName())
                .key(objectKey)
                .contentType(request.getContentType())
                .build();

        PutObjectPresignRequest presignRequest = PutObjectPresignRequest.builder()
                .signatureDuration(Duration.ofSeconds(PRESIGNED_URL_EXPIRATION_SECONDS))
                .putObjectRequest(putObjectRequest)
                .build();

        PresignedPutObjectRequest presignedRequest =
                s3Presigner.presignPutObject(presignRequest);

        return new PresignUploadResponse(
                invoiceId,
                objectKey,
                presignedRequest.url().toString(),
                PRESIGNED_URL_EXPIRATION_SECONDS
        );
    }

    private void validateRequest(PresignUploadRequest request) {
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

        String fileName = request.getFileName();
        if (fileName == null || fileName.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "File name is required"
            );
        }

        if (!fileName.toLowerCase().endsWith(".pdf")) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Only PDF files are allowed"
            );
        }
    }

    private String buildObjectKey(String userId, String invoiceId) {
        String normalizedPrefix = uploadsProperties.getUploadPrefix().endsWith("/")
                ? uploadsProperties.getUploadPrefix()
                : uploadsProperties.getUploadPrefix() + "/";

        return normalizedPrefix + userId + "/" + invoiceId + ".pdf";
    }
}