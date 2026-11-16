package com.duoc.aquachile;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.retry.annotation.EnableRetry;
import org.springframework.scheduling.annotation.EnableAsync;
@EnableRetry
@EnableAsync
@SpringBootApplication
public class AquachileApplication {

	public static void main(String[] args) {
		SpringApplication.run(AquachileApplication.class, args);
	}

}