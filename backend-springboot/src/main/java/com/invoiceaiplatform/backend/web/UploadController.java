package com.invoiceaiplatform.backend.web;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import com.invoiceaiplatform.backend.service.UploadService;
import com.invoiceaiplatform.backend.web.dto.PresignUploadRequest;
import com.invoiceaiplatform.backend.web.dto.PresignUploadResponse;
import jakarta.validation.Valid;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@RequestMapping("/api/uploads")
public class UploadController {

    private final UploadService uploadService;
    private static final Logger log = LoggerFactory.getLogger(UploadController.class);

    public UploadController(UploadService uploadService) {
        this.uploadService = uploadService;
        
    }

    @PostMapping("/presign")
    public PresignUploadResponse presignUpload(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody PresignUploadRequest request
    ) {
        String userId = jwt.getSubject();
        log.info("Received presign request from userId={} for fileName={}, contentType={}, sizeBytes={}",
        jwt.getSubject(),
        request.getFileName(),
        request.getContentType(),
        request.getSizeBytes());
        PresignUploadResponse response = uploadService.createPresignedUpload(userId, request);

log.info("Presign generated for userId={} invoiceId={} objectKey={}",
        userId,
        response.getInvoiceId(),
        response.getObjectKey());

return response;
    }
}