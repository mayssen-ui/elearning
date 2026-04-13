package com.elearning.courseservice.controller;

import com.elearning.courseservice.entity.Course;
import com.elearning.courseservice.service.CourseService;
import com.elearning.courseservice.service.CourseIntegrationService;
import com.elearning.courseservice.service.FileStorageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Base64;

@RestController
@RequestMapping("/api/courses")
public class CourseController {
    @Autowired
    private CourseService courseService;
    
    @Autowired
    private CourseIntegrationService courseIntegrationService;
    
    @Autowired
    private FileStorageService fileStorageService;
    
    @Value("${server.port:3002}")
    private String serverPort;

    @GetMapping
    public ResponseEntity<List<Course>> getCourses() {
        return ResponseEntity.ok(courseService.getCourses());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Course> getCourseById(@PathVariable("id") Long id) {
        Course course = courseService.getCourseById(id);
        if (course != null) {
            return ResponseEntity.ok(course);
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping
    public ResponseEntity<?> createCourse(
            @RequestBody Course course,
            HttpServletRequest request) {
        // Vérifier que l'utilisateur n'est pas un student
        if (isStudent(request)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Students cannot create courses");
        }
        
        Course created = courseService.createCourse(course);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCourse(
            @PathVariable("id") Long id,
            HttpServletRequest request) {
        // Vérifier que l'utilisateur n'est pas un student
        if (isStudent(request)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Students cannot delete courses");
        }
        
        courseService.deleteCourse(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateCourse(
            @PathVariable("id") Long id,
            @RequestBody Course course,
            HttpServletRequest request) {
        // Vérifier que l'utilisateur n'est pas un student
        if (isStudent(request)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Students cannot update courses");
        }
        
        Course updated = courseService.updateCourse(id, course);
        if (updated != null) {
            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.notFound().build();
    }
    
    /**
     * Endpoint pour marquer un cours comme terminé et créer un feedback automatique
     * Appelé par le frontend quand un étudiant clique sur "Done"
     */
    @PostMapping("/{courseId}/complete/{userId}")
    public ResponseEntity<String> completeCourse(
            @PathVariable("courseId") Long courseId,
            @PathVariable("userId") String userId) {
        
        try {
            // Vérifier que le cours existe
            Course course = courseService.getCourseById(courseId);
            if (course == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Cours non trouvé");
            }
            
            // Créer le feedback automatique via OpenFeign
            courseIntegrationService.createAutoFeedbackOnCourseCompletion(userId, courseId);
            
            String message = String.format(
                "Félicitations ! Vous avez terminé le cours : %s. Un feedback automatique a été créé.", 
                course.getTitle()
            );
            
            return ResponseEntity.ok(message);
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Erreur lors de la complétion du cours: " + e.getMessage());
        }
    }
    
    /**
     * Upload un PDF pour un cours
     */
    @PostMapping("/{courseId}/pdf")
    public ResponseEntity<?> uploadPdf(
            @PathVariable("courseId") Long courseId,
            @RequestParam("file") MultipartFile file,
            HttpServletRequest request) {
        
        // Vérifier que l'utilisateur n'est pas un student
        if (isStudent(request)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Students cannot upload PDFs");
        }
        
        try {
            // Vérifier que le cours existe
            Course course = courseService.getCourseById(courseId);
            if (course == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }
            
            // Stocker le fichier
            String fileName = fileStorageService.storeFile(file, courseId);
            
            // Générer l'URL du fichier
            String fileUrl = "http://localhost:" + serverPort + "/api/courses/download/" + fileName;
            
            // Mettre à jour le cours avec l'URL du PDF
            course.setPdfUrl(fileUrl);
            Course updated = courseService.updateCourse(courseId, course);
            
            return ResponseEntity.ok(updated);
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * Télécharger le PDF d'un cours
     */
    @GetMapping("/download/{fileName:.+}")
    public ResponseEntity<Resource> downloadPdf(@PathVariable("fileName") String fileName) {
        
        try {
            Resource resource = fileStorageService.loadFileAsResource(fileName);
            
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_PDF)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + fileName + "\"")
                    .body(resource);
                    
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    /**
     * Supprimer le PDF d'un cours
     */
    @DeleteMapping("/{courseId}/pdf")
    public ResponseEntity<?> deletePdf(
            @PathVariable("courseId") Long courseId,
            HttpServletRequest request) {
        
        // Vérifier que l'utilisateur n'est pas un student
        if (isStudent(request)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Students cannot delete PDFs");
        }
        
        try {
            Course course = courseService.getCourseById(courseId);
            if (course == null) {
                return ResponseEntity.notFound().build();
            }
            
            // Supprimer le fichier si existe
            if (course.getPdfUrl() != null) {
                String fileName = course.getPdfUrl().substring(course.getPdfUrl().lastIndexOf("/") + 1);
                fileStorageService.deleteFile(fileName);
                
                // Mettre à jour le cours
                course.setPdfUrl(null);
                courseService.updateCourse(courseId, course);
            }
            
            return ResponseEntity.noContent().build();
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * Vérifie si l'utilisateur connecté a le rôle student
     */
    private boolean isStudent(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return false; // Pas de token, on laisse passer (autres mécanismes de sécurité)
        }
        
        try {
            String token = authHeader.substring(7);
            // Décoder le payload du JWT (partie entre les deux points)
            String[] parts = token.split("\\.");
            if (parts.length >= 2) {
                String payload = new String(Base64.getDecoder().decode(parts[1]));
                // Vérifier si le payload contient 'student'
                return payload.contains("\"student\"");
            }
        } catch (Exception e) {
            System.err.println("Erreur lors du parsing du token: " + e.getMessage());
        }
        return false;
    }
}

