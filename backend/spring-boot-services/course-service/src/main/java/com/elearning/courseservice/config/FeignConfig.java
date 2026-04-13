package com.elearning.courseservice.config;

import feign.Logger;
import feign.Retryer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class FeignConfig {
    
    @Bean
    public Logger.Level feignLoggerLevel() {
        return Logger.Level.FULL; // Log toutes les requêtes/réponses
    }
    
    @Bean
    public Retryer feignRetryer() {
        return new Retryer.Default(1000, 3000, 3); // 3 tentatives max
    }
}
