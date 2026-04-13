package com.elearning.feedbackservice.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "feedbacks")
@Data
public class Feedback {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    @NotNull(message = "User ID is required")
    @JsonProperty("userId")
    private String userId;

    // Course ID is optional so that users can leave general platform feedback
    @Column(nullable = true)
    @JsonProperty("courseId")
    private Long courseId;

    @Column(columnDefinition = "TEXT")
    private String comment;

    @Column(nullable = false)
    @NotNull(message = "Rating is required")
    @Min(value = 1, message = "Rating must be at least 1")
    @Max(value = 5, message = "Rating must be at most 5")
    private Integer rating;

    @Column(name = "type")
    private String type; // "AUTO", "MANUAL"

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    // Constructors
    public Feedback() {
        this.createdAt = LocalDateTime.now();
        this.type = "MANUAL";
    }

    public Feedback(String userId, Long courseId, String comment, Integer rating, String type) {
        this.userId = userId;
        this.courseId = courseId;
        this.comment = comment;
        this.rating = rating;
        this.type = type != null ? type : "MANUAL";
        this.createdAt = LocalDateTime.now();
    }
}
