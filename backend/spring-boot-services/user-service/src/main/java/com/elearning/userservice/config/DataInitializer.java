package com.elearning.userservice.config;

import com.elearning.userservice.service.KeycloakService;
import com.elearning.userservice.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private UserService userService;
    
    @Autowired
    private KeycloakService keycloakService;

    @Override
    public void run(String... args) {
        System.out.println("=== DataInitializer démarré ===");
        
        new Thread(() -> {
            try {
                Thread.sleep(10000); // Attendre 10s que tout soit initialisé
                syncUsers();
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }).start();
    }
    
    private void syncUsers() {
        System.out.println("=== Attente de Keycloak... ===");
        int retries = 0;
        int maxRetries = 10;
        
        while (retries < maxRetries) {
            try {
                List<Map<String, Object>> keycloakUsers = keycloakService.getAllUsers();
                
                if (keycloakUsers != null && !keycloakUsers.isEmpty()) {
                    System.out.println("✓ Keycloak connecté! " + keycloakUsers.size() + " utilisateurs trouvés");
                    int count = userService.syncAllUsers(keycloakUsers);
                    System.out.println("✓ " + count + "/" + keycloakUsers.size() + " utilisateurs synchronisés dans H2");
                    return;
                } else {
                    System.out.println("⚠ Aucun utilisateur récupéré de Keycloak (liste vide)");
                }
            } catch (Exception e) {
                System.err.println("✗ Exception lors de la tentative " + (retries + 1) + ": " + e.getMessage());
                e.printStackTrace();
            }
            
            retries++;
            if (retries < maxRetries) {
                System.out.println("⚠ Tentative " + retries + "/" + maxRetries + " - Attente 5s...");
                try {
                    Thread.sleep(5000);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    return;
                }
            }
        }
        
        System.err.println("✗ Impossible de se connecter à Keycloak après " + maxRetries + " tentatives");
        System.out.println("⚠ Fallback : synchronisation des utilisateurs statiques...");
        syncStaticUsers();
    }
    
    private void syncStaticUsers() {
        String[][] users = {
            {"admin", "admin@elearning.com", "admin", "admin-keycloak-id"},
            {"instructor", "instructor@elearning.com", "instructor", "instructor-keycloak-id"},
            {"student", "student@elearning.com", "student", "student-keycloak-id"},
            {"kaabimayssen@gmail.com", "kaabimayssen@gmail.com", "student", "kaabi-keycloak-id"}
        };

        for (String[] userData : users) {
            try {
                userService.syncUserFromKeycloak(userData[0], userData[1], userData[2], userData[3]);
                System.out.println("✓ Utilisateur statique: " + userData[0]);
            } catch (Exception e) {
                System.err.println("✗ Erreur sync " + userData[0] + ": " + e.getMessage());
            }
        }
    }
}
