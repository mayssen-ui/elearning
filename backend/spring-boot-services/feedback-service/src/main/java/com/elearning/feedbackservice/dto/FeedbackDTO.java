package com.elearning.feedbackservice.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FeedbackDTO {
    
    @NotNull(message = "User ID is required")
    @JsonProperty("userId")
    private String userId;
    
    // Course feedback can optionally be global (no specific course)
    @JsonProperty("courseId")
    private Long courseId;
    
    // Map the frontend "content" field into this comment property
    @JsonProperty("comment")
    private String comment;
    
    @NotNull(message = "Rating is required")
    @Min(value = 1, message = "Rating must be at least 1")
    @Max(value = 5, message = "Rating must be at most 5")
    private Integer rating;
    
    private String type;
}
