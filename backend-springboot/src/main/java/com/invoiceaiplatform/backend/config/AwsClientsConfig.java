package com.invoiceaiplatform.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;

@Configuration
public class AwsClientsConfig {

    @Bean
    public Region awsRegion(@Value("${aws.region}") String region) {
        return Region.of(region);
    }

    @Bean
    public S3Client s3Client(Region awsRegion) {
        return S3Client.builder()
                .region(awsRegion)
                .build();
    }

    @Bean
    public S3Presigner s3Presigner(Region awsRegion) {
        return S3Presigner.builder()
                .region(awsRegion)
                .build();
    }

    @Bean
    public DynamoDbClient dynamoDbClient(Region awsRegion) {
        return DynamoDbClient.builder()
                .region(awsRegion)
                .build();
    }
}