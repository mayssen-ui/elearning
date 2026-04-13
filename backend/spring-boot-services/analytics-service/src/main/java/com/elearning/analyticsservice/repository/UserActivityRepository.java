package com.elearning.analyticsservice.repository;

import com.elearning.analyticsservice.entity.UserActivity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface UserActivityRepository extends JpaRepository<UserActivity, Long> {
    List<UserActivity> findByUserIdOrderByCreatedAtDesc(String userId);
    
    List<UserActivity> findByUserIdAndActivityTypeOrderByCreatedAtDesc(String userId, String activityType);
    
    @Query("SELECT a FROM UserActivity a WHERE a.userId = ?1 AND a.createdAt >= ?2 ORDER BY a.createdAt DESC")
    List<UserActivity> findRecentByUser(String userId, LocalDateTime since);
    
    @Query("SELECT COUNT(DISTINCT a.userId) FROM UserActivity a WHERE a.createdAt >= ?1")
    Long countActiveUsersSince(LocalDateTime since);
    
    @Query("SELECT a.activityType, COUNT(a) FROM UserActivity a WHERE a.createdAt >= ?1 GROUP BY a.activityType")
    List<Object[]> countByActivityTypeSince(LocalDateTime since);
    
    @Query("SELECT COALESCE(SUM(a.durationSeconds), 0) FROM UserActivity a WHERE a.userId = ?1 AND a.createdAt >= ?2")
    Long sumLearningTimeForUser(String userId, LocalDateTime since);
    
    @Query("SELECT COALESCE(SUM(a.durationSeconds), 0) FROM UserActivity a WHERE a.createdAt >= ?1")
    Long sumTotalLearningTime(LocalDateTime since);
    
    Long countByUserIdAndActivityType(String userId, String activityType);
}
