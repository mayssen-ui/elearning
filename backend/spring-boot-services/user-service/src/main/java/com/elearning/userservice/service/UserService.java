package com.elearning.userservice.service;

import com.elearning.userservice.entity.User;
import com.elearning.userservice.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class UserService {
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private KeycloakService keycloakService;

    public List<User> getUsers() {
        return userRepository.findAll();
    }
    
    public User getUserById(Long id) {
        Optional<User> optionalUser = userRepository.findById(id);
        return optionalUser.orElse(null);
    }
    
    public User createUser(User user) {
        return userRepository.save(user);
    }
    
    public User updateUser(Long id, User user) {
        Optional<User> optionalUser = userRepository.findById(id);
        if (optionalUser.isPresent()) {
            User existingUser = optionalUser.get();
            
            String keycloakId = existingUser.getKeycloakId();
            
            if (user.getUsername() != null) {
                existingUser.setUsername(user.getUsername());
            }
            if (user.getEmail() != null) {
                existingUser.setEmail(user.getEmail());
            }
            if (user.getRole() != null) {
                existingUser.setRole(user.getRole());
            }
            if (user.getProfilePicture() != null) {
                existingUser.setProfilePicture(user.getProfilePicture());
            }
            
            // Sauvegarder dans H2
            User savedUser = userRepository.save(existingUser);
            
            // Synchroniser avec Keycloak si on a un keycloakId
            if (keycloakId != null && !keycloakId.isEmpty()) {
                System.out.println("→ Synchronisation avec Keycloak pour user: " + keycloakId);
                
                // Extraire le prénom et nom de l'username (email)
                String username = existingUser.getUsername();
                String firstName = username;
                String lastName = "User";
                
                // Si c'est un email, extraire la partie avant @ comme prénom
                if (username != null && username.contains("@")) {
                    firstName = username.substring(0, username.indexOf("@"));
                    // Capitaliser la première lettre
                    if (firstName.length() > 0) {
                        firstName = firstName.substring(0, 1).toUpperCase() + firstName.substring(1);
                    }
                }
                
                // Mettre à jour les infos utilisateur dans Keycloak
                boolean updated = keycloakService.updateUser(
                    keycloakId,
                    username,
                    existingUser.getEmail(),
                    firstName,
                    lastName
                );
                
                if (updated) {
                    System.out.println("✓ Utilisateur mis à jour dans Keycloak");
                } else {
                    System.err.println("✗ Échec de la mise à jour dans Keycloak");
                }
                
                // Mettre à jour le rôle dans Keycloak si changé
                if (user.getRole() != null && !user.getRole().isEmpty()) {
                    System.out.println("→ Mise à jour du rôle dans Keycloak: " + user.getRole());
                    boolean roleUpdated = keycloakService.updateUserRealmRole(keycloakId, user.getRole());
                    if (roleUpdated) {
                        System.out.println("✓ Rôle mis à jour dans Keycloak");
                    } else {
                        System.err.println("✗ Échec de la mise à jour du rôle dans Keycloak");
                    }
                }
                
                // Mettre à jour le mot de passe si fourni
                if (user.getPassword() != null && !user.getPassword().isEmpty()) {
                    boolean passwordUpdated = keycloakService.updateUserPassword(keycloakId, user.getPassword());
                    if (passwordUpdated) {
                        System.out.println("✓ Mot de passe mis à jour dans Keycloak");
                    } else {
                        System.err.println("✗ Échec de la mise à jour du mot de passe dans Keycloak");
                    }
                }
            }
            
            return savedUser;
        }
        return null;
    }
    
    public boolean deleteUser(Long id) {
        if (userRepository.existsById(id)) {
            userRepository.deleteById(id);
            return true;
        }
        return false;
    }
    
    // Synchroniser manuellement les utilisateurs Keycloak vers H2
    public User syncUserFromKeycloak(String username, String email, String role, String keycloakId) {
        User existingUser = userRepository.findByKeycloakId(keycloakId);
        if (existingUser == null) {
            existingUser = userRepository.findByUsername(username);
        }
        if (existingUser == null) {
            User newUser = new User(username, email, role, keycloakId);
            return userRepository.save(newUser);
        } else {
            existingUser.setKeycloakId(keycloakId);
            if (email != null) existingUser.setEmail(email);
            // Ne pas écraser le rôle si l'utilisateur existe déjà
            // Le rôle est géré manuellement via l'interface admin
            // if (role != null) existingUser.setRole(role);
            return userRepository.save(existingUser);
        }
    }
    
    // Synchroniser tous les utilisateurs depuis une liste
    public int syncAllUsers(List<Map<String, Object>> keycloakUsers) {
        int count = 0;
        for (Map<String, Object> userData : keycloakUsers) {
            try {
                String keycloakId = (String) userData.get("id");
                String username = (String) userData.get("username");
                String email = (String) userData.get("email");
                
                // Déterminer le rôle depuis les attributs realmRoles ou groups
                String role = "student"; // Par défaut
                @SuppressWarnings("unchecked")
                List<String> roles = (List<String>) userData.get("realmRoles");
                if (roles != null && !roles.isEmpty()) {
                    if (roles.contains("admin")) role = "admin";
                    else if (roles.contains("instructor")) role = "instructor";
                }
                
                // Vérifier si c'est un admin/instructor basé sur le username
                if ("admin".equals(username)) role = "admin";
                else if ("instructor".equals(username)) role = "instructor";
                else if ("student".equals(username)) role = "student";
                
                syncUserFromKeycloak(username, email, role, keycloakId);
                count++;
            } catch (Exception e) {
                System.err.println("✗ Erreur sync user: " + e.getMessage());
            }
        }
        return count;
    }
}
