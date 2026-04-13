package com.elearning.leaderboardservice.repository;

import com.elearning.leaderboardservice.entity.UserPoints;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserPointsRepository extends JpaRepository<UserPoints, Long> {
    Optional<UserPoints> findByUserId(String userId);
    
    List<UserPoints> findTop20ByOrderByTotalPointsDesc();
    
    List<UserPoints> findTop20ByOrderByWeeklyPointsDesc();
    
    List<UserPoints> findTop20ByOrderByMonthlyPointsDesc();
    
    @Query("SELECT COUNT(up) + 1 FROM UserPoints up WHERE up.totalPoints > (SELECT u.totalPoints FROM UserPoints u WHERE u.userId = ?1)")
    Integer findUserRankByTotalPoints(String userId);
    
    @Query("SELECT COUNT(up) + 1 FROM UserPoints up WHERE up.weeklyPoints > (SELECT u.weeklyPoints FROM UserPoints u WHERE u.userId = ?1)")
    Integer findUserRankByWeeklyPoints(String userId);
    
    @Query("SELECT COUNT(up) + 1 FROM UserPoints up WHERE up.monthlyPoints > (SELECT u.monthlyPoints FROM UserPoints u WHERE u.userId = ?1)")
    Integer findUserRankByMonthlyPoints(String userId);
    
    List<UserPoints> findByCurrentLevelGreaterThanEqualOrderByTotalPointsDesc(Integer level);
    
    Long countByCurrentLevelGreaterThanEqual(Integer level);
}
