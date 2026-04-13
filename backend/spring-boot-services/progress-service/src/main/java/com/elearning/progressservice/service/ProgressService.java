package com.elearning.progressservice.service;

import com.elearning.progressservice.entity.Progress;
import com.elearning.progressservice.repository.ProgressRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ProgressService {
    @Autowired
    private ProgressRepository progressRepository;

    public List<Progress> getProgress() {
        if (progressRepository.count() == 0) {
            progressRepository.save(new Progress("default-student-id", 1L, 10));
            progressRepository.save(new Progress("default-student-id", 2L, 50));
        }
        return progressRepository.findAll();
    }

    public Progress updateProgress(String userId, Long courseId, Integer percentage) {
        Progress progress = progressRepository.findByUserIdAndCourseId(userId, courseId)
                .orElse(new Progress(userId, courseId, percentage));
        progress.setPercentage(percentage);
        return progressRepository.save(progress);
    }

    public void deleteProgress(Long id) {
        progressRepository.deleteById(id);
    }
}

