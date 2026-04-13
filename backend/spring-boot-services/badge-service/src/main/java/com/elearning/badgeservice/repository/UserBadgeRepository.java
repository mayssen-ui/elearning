package com.elearning.badgeservice.repository;

import com.elearning.badgeservice.entity.UserBadge;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserBadgeRepository extends JpaRepository<UserBadge, Long> {
    List<UserBadge> findByUserIdOrderByEarnedAtDesc(String userId);
    
    List<UserBadge> findByUserIdAndIsEarnedTrueOrderByEarnedAtDesc(String userId);
    
    Optional<UserBadge> findByUserIdAndBadgeId(String userId, Long badgeId);
    
    Long countByUserIdAndIsEarnedTrue(String userId);
    
    @Query("SELECT ub.badge.id FROM UserBadge ub WHERE ub.userId = ?1 AND ub.isEarned = true")
    List<Long> findEarnedBadgeIdsByUserId(String userId);
    
    @Query("SELECT ub.badge.category, COUNT(ub) FROM UserBadge ub WHERE ub.userId = ?1 AND ub.isEarned = true GROUP BY ub.badge.category")
    List<Object[]> countByCategoryForUser(String userId);
    
    @Query("SELECT ub FROM UserBadge ub WHERE ub.userId = ?1 AND ub.badge.requirementType = ?2")
    List<UserBadge> findByUserIdAndRequirementType(String userId, String requirementType);
    
    @Query("SELECT ub.userId, COUNT(ub) FROM UserBadge ub WHERE ub.isEarned = true GROUP BY ub.userId ORDER BY COUNT(ub) DESC")
    List<Object[]> findTopUsersByBadgeCount(org.springframework.data.domain.Pageable pageable);
}
