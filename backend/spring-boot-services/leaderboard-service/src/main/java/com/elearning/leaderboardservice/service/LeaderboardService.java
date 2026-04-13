package com.elearning.leaderboardservice.service;

import com.elearning.leaderboardservice.entity.PointsTransaction;
import com.elearning.leaderboardservice.entity.UserPoints;
import com.elearning.leaderboardservice.repository.PointsTransactionRepository;
import com.elearning.leaderboardservice.repository.UserPointsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class LeaderboardService {
    @Autowired
    private UserPointsRepository userPointsRepository;
    
    @Autowired
    private PointsTransactionRepository transactionRepository;
    
    private static final Map<String, Integer> POINTS_CONFIG = createPointsConfig();
    
    private static Map<String, Integer> createPointsConfig() {
        Map<String, Integer> map = new HashMap<>();
        map.put("COURSE_COMPLETE", 100);
        map.put("COURSE_START", 10);
        map.put("VIDEO_WATCH", 5);
        map.put("PDF_DOWNLOAD", 3);
        map.put("FEEDBACK_GIVE", 15);
        map.put("MESSAGE_SEND", 2);
        map.put("HELP_OTHERS", 25);
        map.put("STREAK_3_DAYS", 30);
        map.put("STREAK_7_DAYS", 75);
        map.put("FIRST_LOGIN", 20);
        map.put("BADGE_EARNED", 50);
        map.put("QUIZ_COMPLETE", 25);
        map.put("DAILY_LOGIN", 5);
        return Collections.unmodifiableMap(map);
    }
    
    public UserPoints getOrCreateUserPoints(String userId) {
        return userPointsRepository.findByUserId(userId)
            .orElseGet(() -> {
                UserPoints up = new UserPoints();
                up.setUserId(userId);
                up.setTotalPoints(0);
                up.setLearningPoints(0);
                up.setEngagementPoints(0);
                up.setSocialPoints(0);
                up.setAchievementPoints(0);
                up.setCurrentLevel(1);
                up.setWeeklyPoints(0);
                up.setMonthlyPoints(0);
                up.setCreatedAt(LocalDateTime.now());
                return userPointsRepository.save(up);
            });
    }
    
    public PointsTransaction awardPoints(String userId, String actionType, String description) {
        return awardPoints(userId, actionType, description, null, null);
    }
    
    public PointsTransaction awardPoints(String userId, String actionType, String description, 
                                          Long referenceId, String referenceType) {
        int points = POINTS_CONFIG.getOrDefault(actionType, 5);
        String category = determineCategory(actionType);
        
        UserPoints userPoints = getOrCreateUserPoints(userId);
        userPoints.addPoints(category, points);
        userPointsRepository.save(userPoints);
        
        PointsTransaction transaction = new PointsTransaction();
        transaction.setUserId(userId);
        transaction.setPoints(points);
        transaction.setCategory(category);
        transaction.setActionType(actionType);
        transaction.setDescription(description);
        transaction.setReferenceId(referenceId);
        transaction.setReferenceType(referenceType);
        transaction.setCreatedAt(LocalDateTime.now());
        
        return transactionRepository.save(transaction);
    }
    
    private String determineCategory(String actionType) {
        return switch (actionType) {
            case "COURSE_COMPLETE", "COURSE_START", "VIDEO_WATCH", "PDF_DOWNLOAD", "QUIZ_COMPLETE" -> "learning";
            case "FEEDBACK_GIVE", "MESSAGE_SEND", "HELP_OTHERS" -> "social";
            case "STREAK_3_DAYS", "STREAK_7_DAYS", "DAILY_LOGIN" -> "engagement";
            case "FIRST_LOGIN", "BADGE_EARNED" -> "achievement";
            default -> "engagement";
        };
    }
    
    public Map<String, Object> getLeaderboard(String type, int limit) {
        Map<String, Object> result = new HashMap<>();
        List<UserPoints> topUsers;
        
        switch (type) {
            case "weekly" -> topUsers = userPointsRepository.findTop20ByOrderByWeeklyPointsDesc();
            case "monthly" -> topUsers = userPointsRepository.findTop20ByOrderByMonthlyPointsDesc();
            default -> topUsers = userPointsRepository.findTop20ByOrderByTotalPointsDesc();
        }
        
        List<Map<String, Object>> leaderboard = new ArrayList<>();
        int rank = 1;
        for (UserPoints up : topUsers.stream().limit(limit).toList()) {
            Map<String, Object> entry = new HashMap<>();
            entry.put("rank", rank++);
            entry.put("userId", up.getUserId());
            entry.put("totalPoints", up.getTotalPoints());
            entry.put("weeklyPoints", up.getWeeklyPoints());
            entry.put("monthlyPoints", up.getMonthlyPoints());
            entry.put("level", up.getCurrentLevel());
            entry.put("learningPoints", up.getLearningPoints());
            entry.put("socialPoints", up.getSocialPoints());
            entry.put("achievementPoints", up.getAchievementPoints());
            leaderboard.add(entry);
        }
        
        result.put("type", type);
        result.put("leaderboard", leaderboard);
        result.put("generatedAt", LocalDateTime.now());
        
        return result;
    }
    
    public Map<String, Object> getUserRank(String userId) {
        Map<String, Object> rank = new HashMap<>();
        
        UserPoints userPoints = getOrCreateUserPoints(userId);
        
        rank.put("userId", userId);
        rank.put("totalRank", userPointsRepository.findUserRankByTotalPoints(userId));
        rank.put("weeklyRank", userPointsRepository.findUserRankByWeeklyPoints(userId));
        rank.put("monthlyRank", userPointsRepository.findUserRankByMonthlyPoints(userId));
        rank.put("totalPoints", userPoints.getTotalPoints());
        rank.put("weeklyPoints", userPoints.getWeeklyPoints());
        rank.put("monthlyPoints", userPoints.getMonthlyPoints());
        rank.put("level", userPoints.getCurrentLevel());
        rank.put("learningPoints", userPoints.getLearningPoints());
        rank.put("socialPoints", userPoints.getSocialPoints());
        rank.put("engagementPoints", userPoints.getEngagementPoints());
        rank.put("achievementPoints", userPoints.getAchievementPoints());
        
        long totalUsers = userPointsRepository.count();
        rank.put("totalParticipants", totalUsers);
        
        Integer percentile = userPointsRepository.findUserRankByTotalPoints(userId);
        rank.put("percentile", totalUsers > 0 ? Math.round((1.0 - (double)percentile / totalUsers) * 100) : 0);
        
        return rank;
    }
    
    public Map<String, Object> getUserStats(String userId) {
        Map<String, Object> stats = new HashMap<>();
        
        UserPoints userPoints = getOrCreateUserPoints(userId);
        stats.put("points", userPoints);
        
        List<PointsTransaction> recentTransactions = transactionRepository
            .findRecentByUser(userId, LocalDateTime.now().minusDays(30));
        stats.put("recentTransactions", recentTransactions);
        
        List<Object[]> categorySum = transactionRepository.sumPointsByCategory(userId);
        Map<String, Long> pointsByCategory = new HashMap<>();
        for (Object[] row : categorySum) {
            pointsByCategory.put((String) row[0], (Long) row[1]);
        }
        stats.put("pointsByCategory", pointsByCategory);
        
        List<Object[]> actionStats = transactionRepository.getActionStatsByUser(userId);
        Map<String, Map<String, Object>> actionBreakdown = new HashMap<>();
        for (Object[] row : actionStats) {
            Map<String, Object> actionData = new HashMap<>();
            actionData.put("count", row[1]);
            actionData.put("totalPoints", row[2]);
            actionBreakdown.put((String) row[0], actionData);
        }
        stats.put("actionBreakdown", actionBreakdown);
        
        Long transactionCount = transactionRepository.countByUserId(userId);
        stats.put("totalTransactions", transactionCount);
        
        int nextLevel = userPoints.getCurrentLevel() + 1;
        int pointsForNextLevel = calculatePointsForLevel(nextLevel);
        int pointsNeeded = pointsForNextLevel - userPoints.getTotalPoints();
        
        Map<String, Object> levelProgress = new HashMap<>();
        levelProgress.put("currentLevel", userPoints.getCurrentLevel());
        levelProgress.put("nextLevel", nextLevel);
        levelProgress.put("pointsNeeded", Math.max(0, pointsNeeded));
        levelProgress.put("progressPercentage", Math.min(100, 
            (userPoints.getTotalPoints() * 100) / pointsForNextLevel));
        stats.put("levelProgress", levelProgress);
        
        return stats;
    }
    
    private int calculatePointsForLevel(int level) {
        return switch (level) {
            case 1 -> 0;
            case 2 -> 100;
            case 3 -> 200;
            case 4 -> 350;
            case 5 -> 500;
            case 6 -> 700;
            case 7 -> 1000;
            case 8 -> 1300;
            case 9 -> 1600;
            case 10 -> 2000;
            default -> 2000 + (level - 10) * 500;
        };
    }
    
    public void resetWeeklyPoints() {
        List<UserPoints> allUsers = userPointsRepository.findAll();
        for (UserPoints up : allUsers) {
            up.setWeeklyPoints(0);
        }
        userPointsRepository.saveAll(allUsers);
    }
    
    public void resetMonthlyPoints() {
        List<UserPoints> allUsers = userPointsRepository.findAll();
        for (UserPoints up : allUsers) {
            up.setMonthlyPoints(0);
        }
        userPointsRepository.saveAll(allUsers);
    }
}
