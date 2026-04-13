package com.elearning.courseservice.service;

import com.elearning.courseservice.entity.Course;
import com.elearning.courseservice.repository.CourseRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class CourseService {
    @Autowired
    private CourseRepository courseRepository;

    public List<Course> getCourses() {
        if (courseRepository.count() == 0) {
            courseRepository.save(new Course("NestJS Basics", "Learn NestJS from scratch"));
            courseRepository.save(new Course("React Advanced", "Master React hooks and patterns"));
        }
        return courseRepository.findAll();
    }

    public Course createCourse(Course course) {
        return courseRepository.save(course);
    }

    public void deleteCourse(Long id) {
        courseRepository.deleteById(id);
    }

    public Course updateCourse(Long id, Course courseData) {
        Optional<Course> optionalCourse = courseRepository.findById(id);
        if (optionalCourse.isPresent()) {
            Course course = optionalCourse.get();
            if (courseData.getTitle() != null) {
                course.setTitle(courseData.getTitle());
            }
            if (courseData.getDescription() != null) {
                course.setDescription(courseData.getDescription());
            }
            if (courseData.getPdfUrl() != null) {
                course.setPdfUrl(courseData.getPdfUrl());
            }
            return courseRepository.save(course);
        }
        return null;
    }
    
    /**
     * Récupérer un cours par son ID
     * Ajouté pour la complétion de cours
     */
    public Course getCourseById(Long id) {
        Optional<Course> optionalCourse = courseRepository.findById(id);
        return optionalCourse.orElse(null);
    }
}

