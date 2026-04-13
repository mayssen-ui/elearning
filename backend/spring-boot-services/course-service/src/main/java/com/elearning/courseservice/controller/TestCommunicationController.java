package com.elearning.courseservice.controller;

import com.elearning.courseservice.service.CourseIntegrationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/test")
@RequiredArgsConstructor
@Slf4j
public class TestCommunicationController {
    
    private final CourseIntegrationService courseIntegrationService;
    
    /**
     * Endpoint de test pour simuler la fin d'un cours
     */
    @PostMapping("/complete-course/{courseId}/user/{userId}")
    public ResponseEntity<String> testCourseCompletion(
            @PathVariable("courseId") Long courseId,
            @PathVariable("userId") Long userId) {
        
        try {
            log.info("🚀 TEST: Simulation fin du cours {} pour l'utilisateur {}", courseId, userId);
            
            // Déclencher la création du feedback automatique
            courseIntegrationService.createAutoFeedbackOnCourseCompletion(String.valueOf(userId), courseId);
            
            String message = String.format(
                "✅ Test réussi: Course %d terminé pour user %d, feedback automatique créé!", 
                courseId, userId
            );
            
            log.info("🎉 TEST: {}", message);
            return ResponseEntity.ok(message);
            
        } catch (Exception e) {
            log.error("❌ TEST: Erreur lors du test de completion", e);
            return ResponseEntity.badRequest().body("❌ Erreur: " + e.getMessage());
        }
    }
    
    /**
     * Endpoint de test simple pour vérifier la communication
     */
    @GetMapping("/ping")
    public ResponseEntity<String> ping() {
        return ResponseEntity.ok("🏓 Course Service est en ligne et prêt!");
    }
    
    /**
     * Endpoint pour tester la création d'un feedback manuel
     */
    @PostMapping("/create-feedback")
    public ResponseEntity<String> testCreateFeedback() {
        try {
            log.info("🧪 TEST: Création d'un feedback de test");
            
            // Test avec des valeurs fixes
            courseIntegrationService.createAutoFeedbackOnCourseCompletion("123", 1L);
            
            return ResponseEntity.ok("✅ Feedback de test créé (User: 123, Course: 1)");
            
        } catch (Exception e) {
            log.error("❌ TEST: Erreur création feedback", e);
            return ResponseEntity.badRequest().body("❌ Erreur: " + e.getMessage());
        }
    }
}
