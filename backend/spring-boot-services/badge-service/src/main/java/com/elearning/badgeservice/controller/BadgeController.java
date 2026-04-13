package com.elearning.badgeservice.controller;

import com.elearning.badgeservice.entity.Badge;
import com.elearning.badgeservice.entity.UserBadge;
import com.elearning.badgeservice.service.BadgeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/badges")
public class BadgeController {
    @Autowired
    private BadgeService badgeService;
    
    @PostMapping
    public ResponseEntity<Badge> createBadge(@RequestBody Badge badge) {
        return ResponseEntity.ok(badgeService.createBadge(badge));
    }
    
    @GetMapping
    public ResponseEntity<List<Badge>> getAllBadges() {
        return ResponseEntity.ok(badgeService.getAllBadges());
    }
    
    @GetMapping("/category/{category}")
    public ResponseEntity<List<Badge>> getBadgesByCategory(@PathVariable String category) {
        return ResponseEntity.ok(badgeService.getBadgesByCategory(category));
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Badge> getBadgeById(@PathVariable Long id) {
        Badge badge = badgeService.getBadgeById(id);
        if (badge != null) {
            return ResponseEntity.ok(badge);
        }
        return ResponseEntity.notFound().build();
    }
    
    @PostMapping("/init")
    public ResponseEntity<Void> initializeBadges() {
        badgeService.initializeDefaultBadges();
        return ResponseEntity.ok().build();
    }
    
    @PostMapping("/users/{userId}/progress")
    public ResponseEntity<UserBadge> updateProgress(
            @PathVariable String userId,
            @RequestParam String requirementType,
            @RequestParam(defaultValue = "1") int increment) {
        UserBadge earned = badgeService.updateProgress(userId, requirementType, increment);
        return ResponseEntity.ok(earned);
    }
    
    @GetMapping("/users/{userId}")
    public ResponseEntity<List<UserBadge>> getUserBadges(@PathVariable String userId) {
        return ResponseEntity.ok(badgeService.getUserBadges(userId));
    }
    
    @GetMapping("/users/{userId}/earned")
    public ResponseEntity<List<UserBadge>> getUserEarnedBadges(@PathVariable String userId) {
        return ResponseEntity.ok(badgeService.getUserEarnedBadges(userId));
    }
    
    @GetMapping("/users/{userId}/stats")
    public ResponseEntity<Map<String, Object>> getUserBadgeStats(@PathVariable String userId) {
        return ResponseEntity.ok(badgeService.getUserBadgeStats(userId));
    }
    
    @PostMapping("/users/{userId}/award/{badgeId}")
    public ResponseEntity<UserBadge> awardBadge(
            @PathVariable String userId,
            @PathVariable Long badgeId) {
        return ResponseEntity.ok(badgeService.awardBadgeDirectly(userId, badgeId));
    }
    
    @GetMapping("/leaderboard")
    public ResponseEntity<List<Map<String, Object>>> getLeaderboard(@RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(badgeService.getLeaderboard(limit));
    }
}
