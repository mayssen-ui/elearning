package com.elearning.analyticsservice.controller;

import com.elearning.analyticsservice.entity.DailyStats;
import com.elearning.analyticsservice.entity.UserActivity;
import com.elearning.analyticsservice.service.AnalyticsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {
    @Autowired
    private AnalyticsService analyticsService;
    
    @PostMapping("/activities")
    public ResponseEntity<UserActivity> trackActivity(@RequestBody UserActivity activity) {
        return ResponseEntity.ok(analyticsService.trackActivity(activity));
    }
    
    @GetMapping("/users/{userId}/activities")
    public ResponseEntity<List<UserActivity>> getUserActivities(@PathVariable String userId) {
        return ResponseEntity.ok(analyticsService.getUserActivities(userId));
    }
    
    @GetMapping("/users/{userId}/stats")
    public ResponseEntity<Map<String, Object>> getUserStats(@PathVariable String userId) {
        return ResponseEntity.ok(analyticsService.getUserLearningStats(userId));
    }
    
    @GetMapping("/users/{userId}/dashboard")
    public ResponseEntity<Map<String, Object>> getUserDashboard(@PathVariable String userId) {
        return ResponseEntity.ok(analyticsService.getUserDashboard(userId));
    }
    
    @GetMapping("/global")
    public ResponseEntity<Map<String, Object>> getGlobalStats() {
        return ResponseEntity.ok(analyticsService.getGlobalStats());
    }
    
    @GetMapping("/daily")
    public ResponseEntity<List<DailyStats>> getDailyStats(@RequestParam(defaultValue = "30") int days) {
        return ResponseEntity.ok(analyticsService.getDailyStatsHistory(days));
    }
    
    @PostMapping("/daily/increment")
    public ResponseEntity<Void> incrementStat(@RequestParam String statType, @RequestParam(defaultValue = "1") int increment) {
        analyticsService.incrementDailyStat(statType, increment);
        return ResponseEntity.ok().build();
    }
    
    @GetMapping("/leaderboard/learning-time")
    public ResponseEntity<List<Map<String, Object>>> getLearningTimeLeaderboard(@RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(analyticsService.getLeaderboardByLearningTime(limit));
    }
}
