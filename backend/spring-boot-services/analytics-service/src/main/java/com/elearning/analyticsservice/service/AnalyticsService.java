package com.elearning.analyticsservice.service;

import com.elearning.analyticsservice.entity.DailyStats;
import com.elearning.analyticsservice.entity.UserActivity;
import com.elearning.analyticsservice.repository.DailyStatsRepository;
import com.elearning.analyticsservice.repository.UserActivityRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class AnalyticsService {
    @Autowired
    private UserActivityRepository activityRepository;
    
    @Autowired
    private DailyStatsRepository dailyStatsRepository;
    
    public UserActivity trackActivity(UserActivity activity) {
        activity.setCreatedAt(LocalDateTime.now());
        return activityRepository.save(activity);
    }
    
    public List<UserActivity> getUserActivities(String userId) {
        return activityRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }
    
    public Map<String, Object> getUserLearningStats(String userId) {
        Map<String, Object> stats = new HashMap<>();
        
        LocalDateTime lastWeek = LocalDateTime.now().minusDays(7);
        LocalDateTime lastMonth = LocalDateTime.now().minusDays(30);
        
        Long learningTimeWeek = activityRepository.sumLearningTimeForUser(userId, lastWeek);
        Long learningTimeMonth = activityRepository.sumLearningTimeForUser(userId, lastMonth);
        
        Long coursesStarted = activityRepository.countByUserIdAndActivityType(userId, "COURSE_START");
        Long coursesCompleted = activityRepository.countByUserIdAndActivityType(userId, "COURSE_COMPLETE");
        Long videosWatched = activityRepository.countByUserIdAndActivityType(userId, "VIDEO_WATCH");
        Long pdfsDownloaded = activityRepository.countByUserIdAndActivityType(userId, "PDF_DOWNLOAD");
        
        stats.put("userId", userId);
        stats.put("learningTimeWeekMinutes", learningTimeWeek / 60);
        stats.put("learningTimeMonthMinutes", learningTimeMonth / 60);
        stats.put("coursesStarted", coursesStarted);
        stats.put("coursesCompleted", coursesCompleted);
        stats.put("videosWatched", videosWatched);
        stats.put("pdfsDownloaded", pdfsDownloaded);
        
        return stats;
    }
    
    public Map<String, Object> getGlobalStats() {
        Map<String, Object> stats = new HashMap<>();
        
        LocalDateTime lastWeek = LocalDateTime.now().minusDays(7);
        LocalDateTime lastMonth = LocalDateTime.now().minusDays(30);
        
        Long activeUsersWeek = activityRepository.countActiveUsersSince(lastWeek);
        Long activeUsersMonth = activityRepository.countActiveUsersSince(lastMonth);
        Long totalLearningTime = activityRepository.sumTotalLearningTime(lastMonth);
        
        stats.put("activeUsersWeek", activeUsersWeek);
        stats.put("activeUsersMonth", activeUsersMonth);
        stats.put("totalLearningTimeHours", totalLearningTime / 3600);
        
        List<Object[]> activityCounts = activityRepository.countByActivityTypeSince(lastMonth);
        Map<String, Long> activityBreakdown = new HashMap<>();
        for (Object[] row : activityCounts) {
            activityBreakdown.put((String) row[0], (Long) row[1]);
        }
        stats.put("activityBreakdown", activityBreakdown);
        
        return stats;
    }
    
    public DailyStats getOrCreateDailyStats(LocalDate date) {
        return dailyStatsRepository.findByStatDate(date)
            .orElseGet(() -> {
                DailyStats stats = new DailyStats();
                stats.setStatDate(date);
                return dailyStatsRepository.save(stats);
            });
    }
    
    public void incrementDailyStat(String statType, int increment) {
        DailyStats stats = getOrCreateDailyStats(LocalDate.now());
        
        switch (statType) {
            case "activeUsers" -> stats.setActiveUsers(stats.getActiveUsers() + increment);
            case "newEnrollments" -> stats.setNewEnrollments(stats.getNewEnrollments() + increment);
            case "completedCourses" -> stats.setCompletedCourses(stats.getCompletedCourses() + increment);
            case "messagesSent" -> stats.setMessagesSent(stats.getMessagesSent() + increment);
            case "feedbacksGiven" -> stats.setFeedbacksGiven(stats.getFeedbacksGiven() + increment);
        }
        
        dailyStatsRepository.save(stats);
    }
    
    public List<DailyStats> getDailyStatsHistory(int days) {
        LocalDate end = LocalDate.now();
        LocalDate start = end.minusDays(days);
        return dailyStatsRepository.findByStatDateBetweenOrderByStatDateDesc(start, end);
    }
    
    public Map<String, Object> getUserDashboard(String userId) {
        Map<String, Object> dashboard = new HashMap<>();
        
        dashboard.put("learningStats", getUserLearningStats(userId));
        dashboard.put("recentActivities", activityRepository.findRecentByUser(userId, LocalDateTime.now().minusDays(7)));
        dashboard.put("streakDays", calculateStreak(userId));
        
        return dashboard;
    }
    
    private int calculateStreak(String userId) {
        List<UserActivity> activities = activityRepository.findByUserIdOrderByCreatedAtDesc(userId);
        
        if (activities.isEmpty()) return 0;
        
        Set<LocalDate> activeDays = new HashSet<>();
        for (UserActivity activity : activities) {
            activeDays.add(activity.getCreatedAt().toLocalDate());
        }
        
        int streak = 0;
        LocalDate today = LocalDate.now();
        
        for (int i = 0; i < 365; i++) {
            LocalDate checkDate = today.minusDays(i);
            if (activeDays.contains(checkDate)) {
                streak++;
            } else if (i > 0) {
                break;
            }
        }
        
        return streak;
    }
    
    public List<Map<String, Object>> getLeaderboardByLearningTime(int limit) {
        LocalDateTime lastMonth = LocalDateTime.now().minusDays(30);
        List<UserActivity> activities = activityRepository.findRecentByUser("%", lastMonth);
        
        Map<String, Long> userTimeMap = new HashMap<>();
        for (UserActivity activity : activities) {
            userTimeMap.merge(activity.getUserId(), 
                activity.getDurationSeconds() != null ? activity.getDurationSeconds() : 0L, 
                Long::sum);
        }
        
        return userTimeMap.entrySet().stream()
            .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
            .limit(limit)
            .map(entry -> {
                Map<String, Object> map = new HashMap<>();
                map.put("userId", entry.getKey());
                map.put("learningTimeMinutes", entry.getValue() / 60);
                return map;
            })
            .toList();
    }
}
