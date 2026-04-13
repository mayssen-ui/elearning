package com.elearning.progressservice.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;

@FeignClient(name = "course-service", url = "http://host.docker.internal:3002")
public interface CourseClient {
    
    /**
     * Notifier le Course Service qu'un cours a été terminé
     * Déclenchera la création d'un feedback automatique
     */
    @PostMapping("/api/courses/{courseId}/complete/{userId}")
    String notifyCourseCompletion(@PathVariable("courseId") Long courseId, @PathVariable("userId") Long userId);
}
