package com.elearning.progressservice.controller;

import com.elearning.progressservice.entity.Progress;
import com.elearning.progressservice.service.ProgressService;
import com.elearning.progressservice.client.CourseClient;
import com.elearning.progressservice.client.NotificationClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/progress")
@RequiredArgsConstructor
@Slf4j
public class ProgressController {
    
    private final ProgressService progressService;
    private final CourseClient courseClient;
    private final NotificationClient notificationClient;

    @GetMapping
    public ResponseEntity<List<Progress>> getProgress() {
        return ResponseEntity.ok(progressService.getProgress());
    }

    @PostMapping
    public ResponseEntity<Progress> updateProgress(@RequestBody ProgressRequest request) {
        Progress progress = progressService.updateProgress(
                request.getUserId(),
                request.getCourseId(),
                request.getPercentage()
        );
        
        // Créer une notification de progression (50%, 75%, etc.)
        if (request.getPercentage() >= 25 && request.getPercentage() < 50) {
            createProgressNotification(request.getUserId(), request.getCourseId(), request.getPercentage(), "🚀");
        } else if (request.getPercentage() >= 50 && request.getPercentage() < 75) {
            createProgressNotification(request.getUserId(), request.getCourseId(), request.getPercentage(), "⚡");
        } else if (request.getPercentage() >= 75 && request.getPercentage() < 100) {
            createProgressNotification(request.getUserId(), request.getCourseId(), request.getPercentage(), "🔥");
        }
        
        // Si la progression atteint 100%, créer une notification de complétion
        if (request.getPercentage() >= 100) {
            createCompletionNotification(request.getUserId(), request.getCourseId());
            
            // Notifier aussi le Course Service (compatibilité)
            try {
                log.info("🎯 Cours terminé ! Notification du Course Service pour userId={}, courseId={}", 
                        request.getUserId(), request.getCourseId());
                
                String userIdStr = request.getUserId();
                Long userIdLong;
                
                try {
                    userIdLong = Long.parseLong(userIdStr);
                } catch (NumberFormatException e) {
                    userIdLong = Math.abs(userIdStr.hashCode()) % 1000000L;
                    log.info("Conversion UUID → Long: {} → {}", userIdStr, userIdLong);
                }
                
                String response = courseClient.notifyCourseCompletion(
                        request.getCourseId(), 
                        userIdLong
                );
                
                log.info("✅ Course Service a répondu: {}", response);
                
            } catch (Exception e) {
                log.error("❌ Erreur lors de la notification du Course Service", e);
            }
        }
        
        return ResponseEntity.ok(progress);
    }
    
    private void createProgressNotification(String userId, Long courseId, Integer percentage, String emoji) {
        try {
            Map<String, Object> notification = new HashMap<>();
            notification.put("type", "progress");
            notification.put("userId", userId);
            notification.put("courseId", courseId);
            notification.put("percentage", percentage);
            
            String response = notificationClient.createNotification(notification);
            log.info("✅ Notification de progression créée: {}", response);
        } catch (Exception e) {
            log.error("❌ Erreur lors de la création de la notification de progression", e);
        }
    }
    
    private void createCompletionNotification(String userId, Long courseId) {
        try {
            Map<String, Object> notification = new HashMap<>();
            notification.put("type", "achievement");
            notification.put("userId", userId);
            notification.put("courseId", courseId);
            
            String response = notificationClient.createNotification(notification);
            log.info("✅ Notification de complétion créée: {}", response);
        } catch (Exception e) {
            log.error("❌ Erreur lors de la création de la notification de complétion", e);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Progress> updateProgressById(@PathVariable("id") Long id, @RequestBody ProgressRequest request) {
        Progress progress = progressService.updateProgress(
                request.getUserId(),
                request.getCourseId(),
                request.getPercentage()
        );
        return ResponseEntity.ok(progress);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProgress(@PathVariable("id") Long id) {
        progressService.deleteProgress(id);
        return ResponseEntity.noContent().build();
    }

    // Inner class for request body
    public static class ProgressRequest {
        private String userId;
        private Long courseId;
        private Integer percentage;

        public String getUserId() {
            return userId;
        }

        public void setUserId(String userId) {
            this.userId = userId;
        }

        public Long getCourseId() {
            return courseId;
        }

        public void setCourseId(Long courseId) {
            this.courseId = courseId;
        }

        public Integer getPercentage() {
            return percentage;
        }

        public void setPercentage(Integer percentage) {
            this.percentage = percentage;
        }
    }
}

