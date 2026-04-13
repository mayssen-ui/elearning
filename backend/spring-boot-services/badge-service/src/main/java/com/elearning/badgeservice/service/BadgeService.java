package com.elearning.badgeservice.service;

import com.elearning.badgeservice.entity.Badge;
import com.elearning.badgeservice.entity.UserBadge;
import com.elearning.badgeservice.repository.BadgeRepository;
import com.elearning.badgeservice.repository.UserBadgeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class BadgeService {
    @Autowired
    private BadgeRepository badgeRepository;
    
    @Autowired
    private UserBadgeRepository userBadgeRepository;
    
    public Badge createBadge(Badge badge) {
        badge.setCreatedAt(LocalDateTime.now());
        return badgeRepository.save(badge);
    }
    
    public List<Badge> getAllBadges() {
        return badgeRepository.findByIsActiveTrue();
    }
    
    public List<Badge> getBadgesByCategory(String category) {
        return badgeRepository.findByCategory(category);
    }
    
    public Badge getBadgeById(Long id) {
        return badgeRepository.findById(id).orElse(null);
    }
    
    public void initializeDefaultBadges() {
        if (badgeRepository.count() == 0) {
            createDefaultBadges();
        }
    }
    
    private void createDefaultBadges() {
        List<Badge> defaultBadges = Arrays.asList(
            createBadgeConfig("first_login", "Premier Pas", "Vous avez fait votre premier pas sur la plateforme", "beginner", "👋", "#22c55e", "FIRST_LOGIN", 1),
            createBadgeConfig("course_starter", "Apprenti", "Vous avez commencé votre premier cours", "learning", "📚", "#3b82f6", "COURSE_START", 1),
            createBadgeConfig("course_finisher", "Diplômé", "Vous avez terminé votre premier cours", "learning", "🎓", "#8b5cf6", "COURSE_COMPLETE", 1),
            createBadgeConfig("course_master", "Expert", "Vous avez terminé 5 cours", "learning", "🏆", "#f59e0b", "COURSE_COMPLETE", 5),
            createBadgeConfig("learning_streak_3", "Régulier", "3 jours d'apprentissage consécutifs", "engagement", "🔥", "#ef4444", "STREAK_DAYS", 3),
            createBadgeConfig("learning_streak_7", "Assidu", "7 jours d'apprentissage consécutifs", "engagement", "🔥", "#dc2626", "STREAK_DAYS", 7),
            createBadgeConfig("feedback_giver", "Critique", "Vous avez donné votre premier avis", "social", "⭐", "#eab308", "FEEDBACK_GIVE", 1),
            createBadgeConfig("chat_active", "Sociable", "Vous avez envoyé 10 messages", "social", "💬", "#ec4899", "MESSAGE_SEND", 10),
            createBadgeConfig("helper", "Mentor", "Vous avez aidé d'autres étudiants", "social", "🤝", "#14b8a6", "HELP_OTHERS", 3),
            createBadgeConfig("pdf_master", "Lecteur", "Vous avez téléchargé 10 PDFs", "learning", "📄", "#6366f1", "PDF_DOWNLOAD", 10),
            createBadgeConfig("night_owl", "Couche-tard", "Apprentissage après 22h", "special", "🦉", "#4f46e5", "NIGHT_STUDY", 1),
            createBadgeConfig("early_bird", "Lève-tôt", "Apprentissage avant 8h", "special", "🐦", "#f97316", "MORNING_STUDY", 1)
        );
        
        for (Badge badge : defaultBadges) {
            badgeRepository.save(badge);
        }
    }
    
    private Badge createBadgeConfig(String code, String name, String description, String category, 
                                     String icon, String color, String requirementType, int requirementValue) {
        Badge badge = new Badge();
        badge.setCode(code);
        badge.setName(name);
        badge.setDescription(description);
        badge.setCategory(category);
        badge.setIcon(icon);
        badge.setColor(color);
        badge.setRequirementType(requirementType);
        badge.setRequirementValue(requirementValue);
        badge.setIsActive(true);
        return badge;
    }
    
    public UserBadge getOrCreateUserBadge(String userId, Long badgeId) {
        return userBadgeRepository.findByUserIdAndBadgeId(userId, badgeId)
            .orElseGet(() -> {
                UserBadge ub = new UserBadge();
                ub.setUserId(userId);
                Badge badge = badgeRepository.findById(badgeId).orElse(null);
                ub.setBadge(badge);
                ub.setProgressCurrent(0);
                ub.setIsEarned(false);
                return userBadgeRepository.save(ub);
            });
    }
    
    public UserBadge updateProgress(String userId, String requirementType, int progressIncrement) {
        List<Badge> relevantBadges = badgeRepository.findByRequirementType(requirementType);
        UserBadge newlyEarned = null;
        
        for (Badge badge : relevantBadges) {
            UserBadge userBadge = getOrCreateUserBadge(userId, badge.getId());
            
            if (!userBadge.getIsEarned()) {
                int newProgress = userBadge.getProgressCurrent() + progressIncrement;
                userBadge.setProgressCurrent(newProgress);
                
                if (newProgress >= badge.getRequirementValue()) {
                    userBadge.setIsEarned(true);
                    userBadge.setEarnedAt(LocalDateTime.now());
                    newlyEarned = userBadge;
                }
                
                userBadgeRepository.save(userBadge);
            }
        }
        
        return newlyEarned;
    }
    
    public List<UserBadge> getUserBadges(String userId) {
        return userBadgeRepository.findByUserIdOrderByEarnedAtDesc(userId);
    }
    
    public List<UserBadge> getUserEarnedBadges(String userId) {
        return userBadgeRepository.findByUserIdAndIsEarnedTrueOrderByEarnedAtDesc(userId);
    }
    
    public Map<String, Object> getUserBadgeStats(String userId) {
        Map<String, Object> stats = new HashMap<>();
        
        Long totalEarned = userBadgeRepository.countByUserIdAndIsEarnedTrue(userId);
        List<UserBadge> allUserBadges = userBadgeRepository.findByUserIdOrderByEarnedAtDesc(userId);
        List<Badge> allBadges = badgeRepository.findByIsActiveTrue();
        
        stats.put("totalEarned", totalEarned);
        stats.put("totalAvailable", allBadges.size());
        stats.put("completionPercentage", allBadges.size() > 0 ? (totalEarned * 100 / allBadges.size()) : 0);
        
        List<Object[]> categoryCounts = userBadgeRepository.countByCategoryForUser(userId);
        Map<String, Long> byCategory = new HashMap<>();
        for (Object[] row : categoryCounts) {
            byCategory.put((String) row[0], (Long) row[1]);
        }
        stats.put("byCategory", byCategory);
        
        List<Map<String, Object>> inProgressList = new ArrayList<>();
        for (UserBadge ub : allUserBadges) {
            if (!ub.getIsEarned()) {
                Map<String, Object> progress = new HashMap<>();
                progress.put("badge", ub.getBadge());
                progress.put("current", ub.getProgressCurrent());
                progress.put("required", ub.getBadge().getRequirementValue());
                progress.put("percentage", (ub.getProgressCurrent() * 100) / ub.getBadge().getRequirementValue());
                inProgressList.add(progress);
            }
        }
        stats.put("inProgress", inProgressList);
        
        return stats;
    }
    
    public List<Map<String, Object>> getLeaderboard(int limit) {
        List<Object[]> topUsers = userBadgeRepository.findTopUsersByBadgeCount(PageRequest.of(0, limit));
        
        List<Map<String, Object>> leaderboard = new ArrayList<>();
        int rank = 1;
        for (Object[] row : topUsers) {
            Map<String, Object> entry = new HashMap<>();
            entry.put("rank", rank++);
            entry.put("userId", row[0]);
            entry.put("badgeCount", row[1]);
            leaderboard.add(entry);
        }
        
        return leaderboard;
    }
    
    public UserBadge awardBadgeDirectly(String userId, Long badgeId) {
        UserBadge userBadge = getOrCreateUserBadge(userId, badgeId);
        if (!userBadge.getIsEarned()) {
            userBadge.setIsEarned(true);
            userBadge.setEarnedAt(LocalDateTime.now());
            userBadge.setProgressCurrent(userBadge.getBadge().getRequirementValue());
            return userBadgeRepository.save(userBadge);
        }
        return userBadge;
    }
}
