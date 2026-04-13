package com.elearning.feedbackservice.service;

import com.elearning.feedbackservice.client.LeaderboardClient;
import com.elearning.feedbackservice.dto.FeedbackRequest;
import com.elearning.feedbackservice.entity.Feedback;
import com.elearning.feedbackservice.repository.FeedbackRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class FeedbackIntegrationService {
    
    private final FeedbackRepository feedbackRepository;
    private final LeaderboardClient leaderboardClient;
    
    /**
     * Traite un feedback automatique venant d'un autre service
     */
    public String processAutoFeedback(FeedbackRequest feedbackRequest) {
        try {
            // Créer l'entité Feedback
            Feedback feedback = new Feedback();
            feedback.setUserId(feedbackRequest.getUserId());
            feedback.setCourseId(feedbackRequest.getCourseId());
            feedback.setRating(feedbackRequest.getRating());
            feedback.setComment(feedbackRequest.getComment());
            feedback.setType(feedbackRequest.getType());
            feedback.setCreatedAt(feedbackRequest.getCreatedAt());
            
            // Sauvegarder en base
            Feedback savedFeedback = feedbackRepository.save(feedback);
            
            log.info("Feedback automatique sauvegardé: ID={}, Course={}, User={}", 
                    savedFeedback.getId(), 
                    savedFeedback.getCourseId(), 
                    savedFeedback.getUserId());
            
            // Attribuer des points au leaderboard
            try {
                leaderboardClient.awardPoints(
                    savedFeedback.getUserId(),
                    "FEEDBACK_GIVE",
                    "Feedback donné pour le cours " + savedFeedback.getCourseId(),
                    savedFeedback.getId(),
                    "FEEDBACK"
                );
                log.info("Points attribués pour le feedback de l'utilisateur: {}", savedFeedback.getUserId());
            } catch (Exception e) {
                log.error("Erreur lors de l'attribution des points pour le feedback", e);
            }
            
            return "Feedback ID " + savedFeedback.getId() + " créé automatiquement";
            
        } catch (Exception e) {
            log.error("Erreur lors du traitement du feedback automatique", e);
            throw new RuntimeException("Impossible de traiter le feedback automatique", e);
        }
    }
    
    /**
     * Calcule les statistiques d'un cours
     */
    public double calculateCourseAverageRating(Long courseId) {
        try {
            Double average = feedbackRepository.findAverageRatingByCourseId(courseId);
            return average != null ? average : 0.0;
                    
        } catch (Exception e) {
            log.error("Erreur lors du calcul de la moyenne du cours {}", courseId, e);
            return 0.0;
        }
    }
    
    /**
     * Compte le nombre de feedbacks pour un cours
     */
    public long countFeedbacksByCourse(Long courseId) {
        try {
            return feedbackRepository.countByCourseId(courseId);
            
        } catch (Exception e) {
            log.error("Erreur lors du comptage des feedbacks du cours {}", courseId, e);
            return 0;
        }
    }
}
