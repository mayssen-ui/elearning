package com.elearning.courseservice.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.Map;

@FeignClient(name = "notification-service", url = "http://host.docker.internal:3005")
public interface NotificationClient {
    
    @PostMapping("/notifications")
    Map<String, Object> createNotification(@RequestBody Map<String, Object> notification);
}
