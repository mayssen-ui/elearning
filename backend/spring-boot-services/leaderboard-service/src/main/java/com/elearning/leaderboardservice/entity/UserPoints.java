package com.elearning.leaderboardservice.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_points")
public class UserPoints {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false, unique = true)
    private String userId;

    @Column(nullable = false)
    private Integer totalPoints = 0;

    @Column(name = "learning_points")
    private Integer learningPoints = 0;

    @Column(name = "engagement_points")
    private Integer engagementPoints = 0;

    @Column(name = "social_points")
    private Integer socialPoints = 0;

    @Column(name = "achievement_points")
    private Integer achievementPoints = 0;

    @Column(name = "current_level")
    private Integer currentLevel = 1;

    @Column(name = "weekly_points")
    private Integer weeklyPoints = 0;

    @Column(name = "monthly_points")
    private Integer monthlyPoints = 0;

    @Column(name = "last_updated")
    private LocalDateTime lastUpdated = LocalDateTime.now();

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    public UserPoints() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public Integer getTotalPoints() { return totalPoints; }
    public void setTotalPoints(Integer totalPoints) { this.totalPoints = totalPoints; }

    public Integer getLearningPoints() { return learningPoints; }
    public void setLearningPoints(Integer learningPoints) { this.learningPoints = learningPoints; }

    public Integer getEngagementPoints() { return engagementPoints; }
    public void setEngagementPoints(Integer engagementPoints) { this.engagementPoints = engagementPoints; }

    public Integer getSocialPoints() { return socialPoints; }
    public void setSocialPoints(Integer socialPoints) { this.socialPoints = socialPoints; }

    public Integer getAchievementPoints() { return achievementPoints; }
    public void setAchievementPoints(Integer achievementPoints) { this.achievementPoints = achievementPoints; }

    public Integer getCurrentLevel() { return currentLevel; }
    public void setCurrentLevel(Integer currentLevel) { this.currentLevel = currentLevel; }

    public Integer getWeeklyPoints() { return weeklyPoints; }
    public void setWeeklyPoints(Integer weeklyPoints) { this.weeklyPoints = weeklyPoints; }

    public Integer getMonthlyPoints() { return monthlyPoints; }
    public void setMonthlyPoints(Integer monthlyPoints) { this.monthlyPoints = monthlyPoints; }

    public LocalDateTime getLastUpdated() { return lastUpdated; }
    public void setLastUpdated(LocalDateTime lastUpdated) { this.lastUpdated = lastUpdated; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public void addPoints(String category, int points) {
        switch (category) {
            case "learning" -> this.learningPoints += points;
            case "engagement" -> this.engagementPoints += points;
            case "social" -> this.socialPoints += points;
            case "achievement" -> this.achievementPoints += points;
        }
        this.totalPoints += points;
        this.weeklyPoints += points;
        this.monthlyPoints += points;
        this.lastUpdated = LocalDateTime.now();
        
        this.currentLevel = calculateLevel(this.totalPoints);
    }
    
    private int calculateLevel(int points) {
        if (points >= 10000) return 20;
        if (points >= 5000) return 15;
        if (points >= 2500) return 10;
        if (points >= 1000) return 7;
        if (points >= 500) return 5;
        if (points >= 200) return 3;
        if (points >= 100) return 2;
        return 1;
    }
}
