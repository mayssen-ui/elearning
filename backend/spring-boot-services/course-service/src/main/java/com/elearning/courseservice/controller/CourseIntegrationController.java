package com.elearning.courseservice.controller;

import com.elearning.courseservice.service.CourseIntegrationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/courses/integration")
@RequiredArgsConstructor
@Slf4j
public class CourseIntegrationController {
    
    private final CourseIntegrationService courseIntegrationService;
    
    /**
     * Endpoint pour déclencher la création d'un feedback automatique
     * quand un utilisateur termine un cours
     */
    @PostMapping("/{courseId}/complete/{userId}")
    public ResponseEntity<String> completeCourseWithFeedback(
            @PathVariable("courseId") Long courseId,
            @PathVariable("userId") Long userId) {
        
        try {
            courseIntegrationService.createAutoFeedbackOnCourseCompletion(String.valueOf(userId), courseId);
            courseIntegrationService.updateCourseStats(courseId);
            
            return ResponseEntity.ok("Cours terminé avec succès ! Feedback automatique créé.");
            
        } catch (Exception e) {
            log.error("Erreur lors de la complétion du cours", e);
            return ResponseEntity.badRequest().body("Erreur: " + e.getMessage());
        }
    }
    
    /**
     * Endpoint pour tester la communication inter-services
     */
    @GetMapping("/test-communication")
    public ResponseEntity<String> testCommunication() {
        try {
            // Test de communication avec Feedback Service
            log.info("Test de communication inter-services...");
            return ResponseEntity.ok("Communication Course Service ↔ Feedback Service OK !");
            
        } catch (Exception e) {
            log.error("Échec du test de communication", e);
            return ResponseEntity.status(500).body("Échec de la communication: " + e.getMessage());
        }
    }
}
