package com.elearning.analyticsservice.entity;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "daily_stats")
public class DailyStats {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "stat_date", unique = true, nullable = false)
    private LocalDate statDate;

    @Column(name = "active_users")
    private Integer activeUsers = 0;

    @Column(name = "new_enrollments")
    private Integer newEnrollments = 0;

    @Column(name = "completed_courses")
    private Integer completedCourses = 0;

    @Column(name = "total_learning_time_seconds")
    private Long totalLearningTimeSeconds = 0L;

    @Column(name = "messages_sent")
    private Integer messagesSent = 0;

    @Column(name = "feedbacks_given")
    private Integer feedbacksGiven = 0;

    public DailyStats() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public LocalDate getStatDate() { return statDate; }
    public void setStatDate(LocalDate statDate) { this.statDate = statDate; }

    public Integer getActiveUsers() { return activeUsers; }
    public void setActiveUsers(Integer activeUsers) { this.activeUsers = activeUsers; }

    public Integer getNewEnrollments() { return newEnrollments; }
    public void setNewEnrollments(Integer newEnrollments) { this.newEnrollments = newEnrollments; }

    public Integer getCompletedCourses() { return completedCourses; }
    public void setCompletedCourses(Integer completedCourses) { this.completedCourses = completedCourses; }

    public Long getTotalLearningTimeSeconds() { return totalLearningTimeSeconds; }
    public void setTotalLearningTimeSeconds(Long totalLearningTimeSeconds) { this.totalLearningTimeSeconds = totalLearningTimeSeconds; }

    public Integer getMessagesSent() { return messagesSent; }
    public void setMessagesSent(Integer messagesSent) { this.messagesSent = messagesSent; }

    public Integer getFeedbacksGiven() { return feedbacksGiven; }
    public void setFeedbacksGiven(Integer feedbacksGiven) { this.feedbacksGiven = feedbacksGiven; }
}
