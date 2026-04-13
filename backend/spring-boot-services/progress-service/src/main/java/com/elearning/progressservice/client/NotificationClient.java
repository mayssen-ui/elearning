package com.elearning.progressservice.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.Map;

@FeignClient(name = "notification-service", url = "http://host.docker.internal:3005")
public interface NotificationClient {
    
    /**
     * Créer une notification de complétion de cours
     */
    @PostMapping("/notifications")
    String createNotification(@RequestBody Map<String, Object> notification);
}
