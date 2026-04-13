package com.elearning.leaderboardservice.repository;

import com.elearning.leaderboardservice.entity.PointsTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PointsTransactionRepository extends JpaRepository<PointsTransaction, Long> {
    List<PointsTransaction> findByUserIdOrderByCreatedAtDesc(String userId);
    
    List<PointsTransaction> findTop50ByOrderByCreatedAtDesc();
    
    @Query("SELECT pt FROM PointsTransaction pt WHERE pt.userId = ?1 AND pt.createdAt >= ?2 ORDER BY pt.createdAt DESC")
    List<PointsTransaction> findRecentByUser(String userId, LocalDateTime since);
    
    @Query("SELECT pt.category, SUM(pt.points) FROM PointsTransaction pt WHERE pt.userId = ?1 GROUP BY pt.category")
    List<Object[]> sumPointsByCategory(String userId);
    
    @Query("SELECT pt.actionType, COUNT(pt), SUM(pt.points) FROM PointsTransaction pt WHERE pt.userId = ?1 GROUP BY pt.actionType")
    List<Object[]> getActionStatsByUser(String userId);
    
    Long countByUserId(String userId);
}
