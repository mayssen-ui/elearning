package com.elearning.feedbackservice.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class FeedbackNotification {
    private Long feedbackId;
    private Long userId;
    private Long courseId;
    private String message;
    private LocalDateTime timestamp;
    
    public FeedbackNotification() {
        this.timestamp = LocalDateTime.now();
    }
}
