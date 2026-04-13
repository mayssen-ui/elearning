package com.elearning.badgeservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

@SpringBootApplication
@EnableDiscoveryClient
public class BadgeServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(BadgeServiceApplication.class, args);
    }
}
