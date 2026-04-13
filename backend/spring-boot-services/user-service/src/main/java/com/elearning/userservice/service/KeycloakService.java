package com.elearning.userservice.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
public class KeycloakService {

    @Value("${keycloak.auth-server-url:http://host.docker.internal:18080}")
    private String keycloakUrl;

    @Value("${keycloak.realm:elearning}")
    private String realm;

    @Value("${keycloak.admin-username:admin}")
    private String adminUsername;

    @Value("${keycloak.admin-password:admin}")
    private String adminPassword;

    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * Récupère tous les utilisateurs depuis Keycloak
     */
    public List<Map<String, Object>> getAllUsers() {
        try {
            String token = getAdminToken();
            if (token == null) {
                System.err.println("Impossible d'obtenir le token admin Keycloak");
                return new ArrayList<>();
            }

            String url = keycloakUrl + "/admin/realms/" + realm + "/users?max=1000";
            
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(token);
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            HttpEntity<String> entity = new HttpEntity<>(headers);
            
            ResponseEntity<List<Map<String, Object>>> response = restTemplate.exchange(
                url, 
                HttpMethod.GET, 
                entity, 
                new org.springframework.core.ParameterizedTypeReference<List<Map<String, Object>>>() {}
            );
            
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                List<Map<String, Object>> users = response.getBody();
                System.out.println("✓ " + users.size() + " utilisateurs récupérés de Keycloak");
                return users;
            }
        } catch (Exception e) {
            System.err.println("✗ Erreur lors de la récupération des utilisateurs Keycloak: " + e.getMessage());
            e.printStackTrace();
        }
        return new ArrayList<>();
    }

    /**
     * Obtient un token admin pour Keycloak
     */
    private String getAdminToken() {
        try {
            String url = keycloakUrl + "/realms/master/protocol/openid-connect/token";
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
            
            String body = "grant_type=password&" +
                         "client_id=admin-cli&" +
                         "username=" + adminUsername + "&" +
                         "password=" + adminPassword;
            
            HttpEntity<String> entity = new HttpEntity<>(body, headers);
            
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                url, 
                HttpMethod.POST, 
                entity, 
                new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {}
            );
            
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                return (String) response.getBody().get("access_token");
            }
        } catch (Exception e) {
            System.err.println("✗ Erreur lors de l'obtention du token admin: " + e.getMessage());
        }
        return null;
    }

    /**
     * Met à jour un utilisateur dans Keycloak
     */
    public boolean updateUser(String keycloakId, String username, String email, String firstName, String lastName) {
        try {
            String token = getAdminToken();
            if (token == null) {
                System.err.println("Impossible d'obtenir le token admin Keycloak");
                return false;
            }

            String url = keycloakUrl + "/admin/realms/" + realm + "/users/" + keycloakId;
            
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(token);
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            Map<String, Object> userData = new HashMap<>();
            // Username est read-only dans Keycloak par défaut, ne pas l'envoyer
            userData.put("email", email);
            userData.put("firstName", firstName);
            userData.put("lastName", lastName);
            // Activer l'email vérifié pour permettre la connexion
            userData.put("emailVerified", true);
            
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(userData, headers);
            
            ResponseEntity<Void> response = restTemplate.exchange(
                url, 
                HttpMethod.PUT, 
                entity, 
                Void.class
            );
            
            return response.getStatusCode() == HttpStatus.NO_CONTENT || response.getStatusCode() == HttpStatus.OK;
        } catch (Exception e) {
            System.err.println("✗ Erreur lors de la mise à jour de l'utilisateur Keycloak: " + e.getMessage());
            e.printStackTrace();
        }
        return false;
    }
    
    /**
     * Met à jour le mot de passe d'un utilisateur dans Keycloak
     */
    public boolean updateUserPassword(String keycloakId, String newPassword) {
        try {
            String token = getAdminToken();
            if (token == null) {
                System.err.println("Impossible d'obtenir le token admin Keycloak");
                return false;
            }

            String url = keycloakUrl + "/admin/realms/" + realm + "/users/" + keycloakId + "/reset-password";
            
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(token);
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            Map<String, Object> passwordData = new HashMap<>();
            passwordData.put("type", "password");
            passwordData.put("value", newPassword);
            passwordData.put("temporary", false);
            
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(passwordData, headers);
            
            ResponseEntity<Void> response = restTemplate.exchange(
                url, 
                HttpMethod.PUT, 
                entity, 
                Void.class
            );
            
            return response.getStatusCode() == HttpStatus.NO_CONTENT || response.getStatusCode() == HttpStatus.OK;
        } catch (Exception e) {
            System.err.println("✗ Erreur lors de la mise à jour du mot de passe Keycloak: " + e.getMessage());
            e.printStackTrace();
        }
        return false;
    }
    
    /**
     * Met à jour les rôles realm d'un utilisateur dans Keycloak
     */
    public boolean updateUserRealmRole(String keycloakId, String role) {
        try {
            String token = getAdminToken();
            if (token == null) {
                System.err.println("Impossible d'obtenir le token admin Keycloak");
                return false;
            }

            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(token);
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            // D'abord, essayer de récupérer le rôle realm
            String realmRoleUrl = keycloakUrl + "/admin/realms/" + realm + "/roles/" + role;
            HttpEntity<String> getEntity = new HttpEntity<>(headers);
            
            Map<String, Object> roleData = null;
            try {
                ResponseEntity<Map<String, Object>> roleResponse = restTemplate.exchange(
                    realmRoleUrl,
                    HttpMethod.GET,
                    getEntity,
                    new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {}
                );
                if (roleResponse.getStatusCode() == HttpStatus.OK) {
                    roleData = roleResponse.getBody();
                }
            } catch (Exception e) {
                System.out.println("Rôle " + role + " non trouvé dans Keycloak, tentative de création...");
            }
            
            // Si le rôle n'existe pas, le créer
            if (roleData == null) {
                try {
                    Map<String, Object> newRole = new HashMap<>();
                    newRole.put("name", role);
                    newRole.put("description", "Role " + role);
                    
                    HttpEntity<Map<String, Object>> createEntity = new HttpEntity<>(newRole, headers);
                    ResponseEntity<Void> createResponse = restTemplate.exchange(
                        keycloakUrl + "/admin/realms/" + realm + "/roles",
                        HttpMethod.POST,
                        createEntity,
                        Void.class
                    );
                    
                    if (createResponse.getStatusCode() == HttpStatus.CREATED || 
                        createResponse.getStatusCode() == HttpStatus.NO_CONTENT) {
                        System.out.println("✓ Rôle " + role + " créé dans Keycloak");
                        
                        // Récupérer le rôle créé
                        ResponseEntity<Map<String, Object>> roleResponse = restTemplate.exchange(
                            realmRoleUrl,
                            HttpMethod.GET,
                            getEntity,
                            new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {}
                        );
                        if (roleResponse.getStatusCode() == HttpStatus.OK) {
                            roleData = roleResponse.getBody();
                        }
                    }
                } catch (Exception createEx) {
                    System.err.println("✗ Impossible de créer le rôle: " + createEx.getMessage());
                }
            }
            
            if (roleData != null) {
                // D'abord, supprimer les anciens rôles realm de l'utilisateur
                try {
                    String getRolesUrl = keycloakUrl + "/admin/realms/" + realm + "/users/" + keycloakId + "/role-mappings/realm";
                    ResponseEntity<List<Map<String, Object>>> existingRolesResponse = restTemplate.exchange(
                        getRolesUrl,
                        HttpMethod.GET,
                        getEntity,
                        new org.springframework.core.ParameterizedTypeReference<List<Map<String, Object>>>() {}
                    );
                    
                    if (existingRolesResponse.getStatusCode() == HttpStatus.OK && existingRolesResponse.getBody() != null) {
                        List<Map<String, Object>> existingRoles = existingRolesResponse.getBody();
                        if (!existingRoles.isEmpty()) {
                            HttpEntity<List<Map<String, Object>>> deleteEntity = new HttpEntity<>(existingRoles, headers);
                            restTemplate.exchange(
                                getRolesUrl,
                                HttpMethod.DELETE,
                                deleteEntity,
                                Void.class
                            );
                            System.out.println("✓ Anciens rôles supprimés");
                        }
                    }
                } catch (Exception e) {
                    System.err.println("Note: Impossible de supprimer les anciens rôles: " + e.getMessage());
                }
                
                // Assigner le nouveau rôle à l'utilisateur
                String assignUrl = keycloakUrl + "/admin/realms/" + realm + "/users/" + keycloakId + "/role-mappings/realm";
                
                List<Map<String, Object>> roles = new ArrayList<>();
                roles.add(roleData);
                
                HttpEntity<List<Map<String, Object>>> assignEntity = new HttpEntity<>(roles, headers);
                
                ResponseEntity<Void> response = restTemplate.exchange(
                    assignUrl,
                    HttpMethod.POST,
                    assignEntity,
                    Void.class
                );
                
                boolean success = response.getStatusCode() == HttpStatus.NO_CONTENT || response.getStatusCode() == HttpStatus.OK;
                if (success) {
                    System.out.println("✓ Rôle " + role + " assigné à l'utilisateur");
                }
                return success;
            } else {
                System.err.println("✗ Impossible de récupérer ou créer le rôle " + role);
            }
        } catch (Exception e) {
            System.err.println("✗ Erreur lors de la mise à jour du rôle Keycloak: " + e.getMessage());
            e.printStackTrace();
        }
        return false;
    }
}
