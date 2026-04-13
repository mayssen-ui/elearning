package com.elearning.feedbackservice.controller;

import com.elearning.feedbackservice.entity.Feedback;
import com.elearning.feedbackservice.repository.FeedbackRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/test")
@RequiredArgsConstructor
@Slf4j
public class TestFeedbackController {
    
    private final FeedbackRepository feedbackRepository;
    
    /**
     * Endpoint pour voir tous les feedbacks
     */
    @GetMapping("/feedbacks")
    public ResponseEntity<List<Feedback>> getAllFeedbacks() {
        try {
            List<Feedback> feedbacks = feedbackRepository.findAll();
            log.info("📊 TEST: {} feedbacks trouvés", feedbacks.size());
            return ResponseEntity.ok(feedbacks);
        } catch (Exception e) {
            log.error("❌ TEST: Erreur récupération feedbacks", e);
            return ResponseEntity.badRequest().build();
        }
    }
    
    /**
     * Endpoint pour voir les feedbacks d'un cours spécifique
     */
    @GetMapping("/feedbacks/course/{courseId}")
    public ResponseEntity<List<Feedback>> getFeedbacksByCourse(@PathVariable("courseId") Long courseId) {
        try {
            List<Feedback> feedbacks = feedbackRepository.findByCourseId(courseId);
            log.info("📊 TEST: {} feedbacks trouvés pour le cours {}", feedbacks.size(), courseId);
            return ResponseEntity.ok(feedbacks);
        } catch (Exception e) {
            log.error("❌ TEST: Erreur récupération feedbacks course {}", courseId, e);
            return ResponseEntity.badRequest().build();
        }
    }
    
    /**
     * Endpoint pour vérifier la santé du service
     */
    @GetMapping("/health")
    public ResponseEntity<String> health() {
        try {
            long count = feedbackRepository.count();
            String message = String.format("💚 Feedback Service OK - %d feedbacks en base", count);
            log.info("🏥 TEST: {}", message);
            return ResponseEntity.ok(message);
        } catch (Exception e) {
            log.error("❌ TEST: Erreur health check", e);
            return ResponseEntity.badRequest().body("❌ Service indisponible: " + e.getMessage());
        }
    }
    
    /**
     * Endpoint pour créer un feedback de test directement
     */
    @PostMapping("/create-test-feedback")
    public ResponseEntity<Feedback> createTestFeedback() {
        try {
            Feedback feedback = new Feedback();
            feedback.setUserId("999");
            feedback.setCourseId(1L);
            feedback.setRating(5);
            feedback.setComment("Feedback de test créé directement");
            feedback.setType("TEST");
            
            Feedback saved = feedbackRepository.save(feedback);
            log.info("✅ TEST: Feedback de test créé avec ID: {}", saved.getId());
            
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            log.error("❌ TEST: Erreur création feedback test", e);
            return ResponseEntity.badRequest().build();
        }
    }
}
