package com.invoiceaiplatform.backend.web;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import com.invoiceaiplatform.backend.service.UploadService;
import com.invoiceaiplatform.backend.web.dto.PresignUploadRequest;
import com.invoiceaiplatform.backend.web.dto.PresignUploadResponse;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/uploads")
public class UploadController {

    private final UploadService uploadService;

    public UploadController(UploadService uploadService) {
        this.uploadService = uploadService;
    }

    @PostMapping("/presign")
    public PresignUploadResponse presignUpload(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody PresignUploadRequest request
    ) {
        String userId = jwt.getSubject();
        return uploadService.createPresignedUpload(userId, request);
    }
}