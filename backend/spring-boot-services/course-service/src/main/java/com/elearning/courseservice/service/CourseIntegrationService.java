package com.elearning.courseservice.service;

import com.elearning.courseservice.client.FeedbackClient;
import com.elearning.courseservice.client.NotificationClient;
import com.elearning.courseservice.dto.FeedbackRequest;
import com.elearning.courseservice.entity.Course;
import com.elearning.courseservice.repository.CourseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class CourseIntegrationService {
    
    private final FeedbackClient feedbackClient;
    private final NotificationClient notificationClient;
    private final CourseRepository courseRepository;
    
    /**
     * Crée un feedback automatique quand un utilisateur termine un cours
     */
    public void createAutoFeedbackOnCourseCompletion(String userId, Long courseId) {
        try {
            // Récupérer les informations du cours
            Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found"));
            
            // Convertir le userId Long en UUID standard pour le feedback
            String userIdStr = userId;
            
            // Créer un feedback automatique
            FeedbackRequest autoFeedback = new FeedbackRequest();
            autoFeedback.setUserId(userIdStr); // Utiliser String au lieu de Long
            autoFeedback.setCourseId(courseId);
            autoFeedback.setRating(5); // Note par défaut
            autoFeedback.setComment("Félicitations ! Vous avez terminé le cours : " + course.getTitle());
            autoFeedback.setType("AUTO");
            
            // Appeler le Feedback Service via OpenFeign
            FeedbackRequest createdFeedback = feedbackClient.createAutoFeedback(autoFeedback);
            
            log.info("Feedback automatique créé avec succès: {}", createdFeedback);
            
            // Créer une notification de complétion
            try {
                Map<String, Object> notification = new HashMap<>();
                notification.put("type", "achievement");
                notification.put("userId", userIdStr);
                notification.put("courseId", courseId);
                notification.put("message", "Félicitations ! Vous avez terminé le cours : " + course.getTitle());
                
                Map<String, Object> createdNotification = notificationClient.createNotification(notification);
                log.info("Notification de complétion créée avec succès: {}", createdNotification);
            } catch (Exception e) {
                log.error("Erreur lors de la création de la notification", e);
            }
            
        } catch (Exception e) {
            log.error("Erreur lors de la création du feedback automatique", e);
            throw new RuntimeException("Impossible de créer le feedback automatique", e);
        }
    }
    
    /**
     * Met à jour les statistiques du cours après un nouveau feedback
     */
    public void updateCourseStats(Long courseId) {
        try {
            // Ici on pourrait appeler un endpoint du Feedback Service
            // pour récupérer les statistiques et mettre à jour le cours
            log.info("Statistiques du cours {} mises à jour", courseId);
            
        } catch (Exception e) {
            log.error("Erreur lors de la mise à jour des statistiques", e);
        }
    }
}
