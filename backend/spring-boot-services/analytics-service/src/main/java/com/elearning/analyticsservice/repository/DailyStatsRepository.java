package com.elearning.analyticsservice.repository;

import com.elearning.analyticsservice.entity.DailyStats;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface DailyStatsRepository extends JpaRepository<DailyStats, Long> {
    Optional<DailyStats> findByStatDate(LocalDate statDate);
    List<DailyStats> findByStatDateBetweenOrderByStatDateDesc(LocalDate start, LocalDate end);
}
