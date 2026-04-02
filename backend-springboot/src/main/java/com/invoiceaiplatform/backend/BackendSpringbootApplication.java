package com.invoiceaiplatform.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

import com.invoiceaiplatform.backend.config.UploadsProperties;

@SpringBootApplication
@EnableConfigurationProperties(UploadsProperties.class)
public class BackendSpringbootApplication {

	public static void main(String[] args) {
		SpringApplication.run(BackendSpringbootApplication.class, args);
	}

}