package com.elearning.feedbackservice.repository;

import com.elearning.feedbackservice.entity.Feedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FeedbackRepository extends JpaRepository<Feedback, Long> {
    
    List<Feedback> findByCourseId(Long courseId);
    
    List<Feedback> findByUserId(String userId);
    
    List<Feedback> findByCourseIdAndUserId(Long courseId, String userId);
    
    @Query("SELECT COUNT(f) FROM Feedback f WHERE f.courseId = :courseId")
    long countByCourseId(@Param("courseId") Long courseId);
    
    @Query("SELECT AVG(f.rating) FROM Feedback f WHERE f.courseId = :courseId")
    Double findAverageRatingByCourseId(@Param("courseId") Long courseId);
}
