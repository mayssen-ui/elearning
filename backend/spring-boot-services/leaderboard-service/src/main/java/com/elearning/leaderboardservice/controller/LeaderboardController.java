package com.elearning.leaderboardservice.controller;

import com.elearning.leaderboardservice.entity.PointsTransaction;
import com.elearning.leaderboardservice.service.LeaderboardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/leaderboard")
public class LeaderboardController {
    @Autowired
    private LeaderboardService leaderboardService;
    
    @PostMapping("/points/award")
    public ResponseEntity<PointsTransaction> awardPoints(
            @RequestParam String userId,
            @RequestParam String actionType,
            @RequestParam(required = false) String description,
            @RequestParam(required = false) Long referenceId,
            @RequestParam(required = false) String referenceType) {
        
        String desc = description != null ? description : actionType;
        PointsTransaction transaction = leaderboardService.awardPoints(userId, actionType, desc, referenceId, referenceType);
        return ResponseEntity.ok(transaction);
    }
    
    @GetMapping
    public ResponseEntity<Map<String, Object>> getLeaderboard(
            @RequestParam(defaultValue = "total") String type,
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(leaderboardService.getLeaderboard(type, limit));
    }
    
    @GetMapping("/users/{userId}/rank")
    public ResponseEntity<Map<String, Object>> getUserRank(@PathVariable String userId) {
        return ResponseEntity.ok(leaderboardService.getUserRank(userId));
    }
    
    @GetMapping("/users/{userId}/stats")
    public ResponseEntity<Map<String, Object>> getUserStats(@PathVariable String userId) {
        return ResponseEntity.ok(leaderboardService.getUserStats(userId));
    }
    
    @PostMapping("/reset/weekly")
    public ResponseEntity<Void> resetWeeklyPoints() {
        leaderboardService.resetWeeklyPoints();
        return ResponseEntity.ok().build();
    }
    
    @PostMapping("/reset/monthly")
    public ResponseEntity<Void> resetMonthlyPoints() {
        leaderboardService.resetMonthlyPoints();
        return ResponseEntity.ok().build();
    }
}
