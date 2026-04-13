package com.elearning.userservice.controller;

import com.elearning.userservice.entity.User;
import com.elearning.userservice.service.KeycloakService;
import com.elearning.userservice.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {
    @Autowired
    private UserService userService;
    
    @Autowired
    private KeycloakService keycloakService;

    @GetMapping
    public ResponseEntity<List<User>> getUsers() {
        return ResponseEntity.ok(userService.getUsers());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable("id") Long id) {
        User user = userService.getUserById(id);
        if (user != null) {
            return ResponseEntity.ok(user);
        }
        return ResponseEntity.notFound().build();
    }
    
    @PostMapping
    public ResponseEntity<User> createUser(@RequestBody User user) {
        User createdUser = userService.createUser(user);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdUser);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<User> updateUser(@PathVariable("id") Long id, @RequestBody User user) {
        User updatedUser = userService.updateUser(id, user);
        if (updatedUser != null) {
            return ResponseEntity.ok(updatedUser);
        }
        return ResponseEntity.notFound().build();
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable("id") Long id) {
        boolean deleted = userService.deleteUser(id);
        if (deleted) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
    
    @PostMapping("/sync")
    public ResponseEntity<String> syncUserFromKeycloak(@RequestParam String username, 
                                                      @RequestParam String email, 
                                                      @RequestParam String role,
                                                      @RequestParam(required = false) String keycloakId) {
        try {
            User user = userService.syncUserFromKeycloak(username, email, role, keycloakId);
            return ResponseEntity.ok("Utilisateur synchronisé: " + user.getUsername());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Erreur de synchronisation: " + e.getMessage());
        }
    }
    
    /**
     * Synchronise TOUS les utilisateurs depuis Keycloak vers H2
     * Cet endpoint peut être appelé manuellement ou automatiquement
     */
    @PostMapping("/sync-all")
    public ResponseEntity<String> syncAllUsersFromKeycloak() {
        try {
            // 1. Récupérer tous les utilisateurs de Keycloak
            List<Map<String, Object>> keycloakUsers = keycloakService.getAllUsers();
            
            if (keycloakUsers.isEmpty()) {
                return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                        .body("Impossible de récupérer les utilisateurs de Keycloak");
            }
            
            // 2. Les synchroniser dans H2
            int count = userService.syncAllUsers(keycloakUsers);
            
            return ResponseEntity.ok("✓ " + count + "/" + keycloakUsers.size() + 
                    " utilisateurs synchronisés depuis Keycloak vers H2");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Erreur de synchronisation: " + e.getMessage());
        }
    }
}

