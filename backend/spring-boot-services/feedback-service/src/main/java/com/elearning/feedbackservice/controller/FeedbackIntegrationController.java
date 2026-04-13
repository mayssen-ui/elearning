package com.elearning.feedbackservice.controller;

import com.elearning.feedbackservice.service.FeedbackIntegrationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/feedbacks/integration")
@RequiredArgsConstructor
@Slf4j
public class FeedbackIntegrationController {
    
    private final FeedbackIntegrationService feedbackIntegrationService;
    
    /**
     * Endpoint appelé par Course Service via OpenFeign
     * pour créer un feedback automatique
     */
    @PostMapping(value = "/auto", produces = "application/json")
    @ResponseBody
    public com.elearning.feedbackservice.dto.FeedbackRequest receiveAutoFeedback(
            @RequestBody com.elearning.feedbackservice.dto.FeedbackRequest feedbackRequest) {
        
        try {
            log.info("Réception feedback automatique du Course Service: {}", feedbackRequest);
            
            // Traiter le feedback automatique et retourner l'objet créé
            String result = feedbackIntegrationService.processAutoFeedback(feedbackRequest);
            log.info("Feedback automatique traité avec succès: {}", result);
            
            // Créer et retourner le FeedbackRequest avec l'ID généré
            com.elearning.feedbackservice.dto.FeedbackRequest response = new com.elearning.feedbackservice.dto.FeedbackRequest();
            response.setUserId(feedbackRequest.getUserId());
            response.setCourseId(feedbackRequest.getCourseId());
            response.setRating(feedbackRequest.getRating());
            response.setComment(feedbackRequest.getComment());
            response.setType(feedbackRequest.getType());
            
            return response;
            
        } catch (Exception e) {
            log.error("Erreur lors du traitement du feedback automatique", e);
            throw new RuntimeException("Impossible de traiter le feedback automatique", e);
        }
    }
    
    /**
     * Endpoint pour notifier les autres services
     * quand un nouveau feedback est créé
     */
    @PostMapping("/notify")
    public ResponseEntity<String> notifyNewFeedback(
            @RequestBody com.elearning.feedbackservice.dto.FeedbackNotification notification) {
        
        try {
            log.info("Notification de nouveau feedback: {}", notification);
            
            // Ici on pourrait notifier d'autres services:
            // - Notification Service (via RabbitMQ/Kafka)
            // - User Service (mettre à jour les badges)
            // - Course Service (statistiques)
            
            return ResponseEntity.ok("Notification traitée avec succès");
            
        } catch (Exception e) {
            log.error("Erreur lors de la notification", e);
            return ResponseEntity.badRequest().body("Erreur: " + e.getMessage());
        }
    }
    
    /**
     * Endpoint pour vérifier l'état de santé du service
     */
    @GetMapping("/health")
    public ResponseEntity<String> healthCheck() {
        return ResponseEntity.ok("Feedback Service is healthy and ready!");
    }
}
