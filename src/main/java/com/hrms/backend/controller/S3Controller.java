package com.hrms.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.PresignedPutObjectRequest;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/s3")
public class S3Controller {

    private final S3Presigner s3Presigner;
    private final String bucketName = "hrms-bucket"; 

    public S3Controller(S3Presigner s3Presigner) {
        this.s3Presigner = s3Presigner;
    }

    @GetMapping("/presigned-url")
    public ResponseEntity<Map<String, String>> generatePresignedUrl(
            @RequestParam String fileName,
            @RequestParam String contentType) {

        String uniqueFileName = "company-logos/" + UUID.randomUUID() + "-" + fileName;

        PutObjectRequest objectRequest = PutObjectRequest.builder()
                .bucket(bucketName)
                .key(uniqueFileName)
                .contentType(contentType)
                .build();

        PresignedPutObjectRequest presignedRequest = s3Presigner.presignPutObject(r -> r
                .signatureDuration(Duration.ofMinutes(10))
                .putObjectRequest(objectRequest)
        );

        String uploadUrl = presignedRequest.url().toString();
        String fileUrl = uploadUrl.substring(0, uploadUrl.indexOf("?")); 

        Map<String, String> response = new HashMap<>();
        response.put("uploadUrl", uploadUrl);
        response.put("fileUrl", fileUrl);

        return ResponseEntity.ok(response);
    }
}