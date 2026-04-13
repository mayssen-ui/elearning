package com.elearning.feedbackservice.controller;

import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import jakarta.validation.Valid;
import com.elearning.feedbackservice.client.LeaderboardClient;
import com.elearning.feedbackservice.entity.Feedback;
import com.elearning.feedbackservice.dto.FeedbackDTO;
import com.elearning.feedbackservice.repository.FeedbackRepository;
import java.util.List;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/feedbacks")
@Validated
@Slf4j
public class FeedbackController {

    @Autowired
    private FeedbackRepository feedbackRepository;

    @Autowired
    private LeaderboardClient leaderboardClient;

    @GetMapping
    public List<Feedback> getFeedbacks() {
        return feedbackRepository.findAll();
    }

    @GetMapping("/course/{courseId}")
    public List<Feedback> getFeedbacksByCourse(@PathVariable("courseId") Long courseId) {
        return feedbackRepository.findByCourseId(courseId);
    }

    @PostMapping
    public ResponseEntity<?> createFeedback(@Valid @RequestBody FeedbackDTO feedbackDTO) {
        try {
            log.info("Received feedback DTO: {}", feedbackDTO);
            
            // Convert DTO to Entity
            Feedback feedback = new Feedback();
            feedback.setUserId(feedbackDTO.getUserId());
            feedback.setCourseId(feedbackDTO.getCourseId());
            feedback.setRating(feedbackDTO.getRating());
            feedback.setComment(feedbackDTO.getComment());
            feedback.setType(feedbackDTO.getType());
            
            if (feedback.getCreatedAt() == null) {
                feedback.setCreatedAt(java.time.LocalDateTime.now());
            }
            
            Feedback savedFeedback = feedbackRepository.save(feedback);
            log.info("Feedback saved successfully with ID: {}", savedFeedback.getId());
            
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
            
            return ResponseEntity.ok(savedFeedback);
            
        } catch (Exception e) {
            log.error("Error creating feedback", e);
            return ResponseEntity.internalServerError()
                    .body("Error creating feedback: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateFeedback(@PathVariable("id") Long id, @RequestBody Feedback feedback) {
        try {
            // Charger le feedback existant
            Feedback existingFeedback = feedbackRepository.findById(id).orElse(null);
            if (existingFeedback == null) {
                return ResponseEntity.notFound().build();
            }
            
            // Mettre à jour seulement les champs fournis
            if (feedback.getRating() != null) {
                existingFeedback.setRating(feedback.getRating());
            }
            if (feedback.getComment() != null) {
                existingFeedback.setComment(feedback.getComment());
            }
            // Le champ content du frontend correspond à comment dans l'entité
            // Lombok @Data gère le mapping automatiquement
            
            Feedback updated = feedbackRepository.save(existingFeedback);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            log.error("Error updating feedback", e);
            return ResponseEntity.internalServerError().body("Error updating feedback: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public String deleteFeedback(@PathVariable("id") Long id) {
        feedbackRepository.deleteById(id);
        return "Feedback " + id + " deleted";
    }
}
