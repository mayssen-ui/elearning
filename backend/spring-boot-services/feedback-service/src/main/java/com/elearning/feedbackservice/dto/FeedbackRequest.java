package com.elearning.feedbackservice.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class FeedbackRequest {
    // User IDs come from Keycloak (UUID string)
    private String userId;
    private Long courseId;
    private Integer rating;
    private String comment;
    private String type; // "AUTO", "MANUAL"
    private LocalDateTime createdAt;
    
    public FeedbackRequest() {
        this.createdAt = LocalDateTime.now();
    }
}
