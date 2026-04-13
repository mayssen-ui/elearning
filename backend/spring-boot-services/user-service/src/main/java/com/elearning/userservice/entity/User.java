package com.elearning.userservice.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String username;

    @Column(nullable = false)
    private String email;

    @Column(nullable = false)
    private String role = "user"; // 'admin', 'instructor', 'student'

    @Column(unique = true)
    private String keycloakId; // UUID Keycloak pour correspondance avec les feedbacks

    @Column(length = 2000000)
    private String profilePicture; // Photo de profil en base64 ou URL

    @Transient
    private String password; // Mot de passe temporaire pour mise à jour (non persisté)

    public User() {
    }

    public User(String username, String email, String role, String keycloakId) {
        this.username = username;
        this.email = email;
        this.role = role;
        this.keycloakId = keycloakId;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getKeycloakId() {
        return keycloakId;
    }

    public void setKeycloakId(String keycloakId) {
        this.keycloakId = keycloakId;
    }

    public String getProfilePicture() {
        return profilePicture;
    }

    public void setProfilePicture(String profilePicture) {
        this.profilePicture = profilePicture;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}
