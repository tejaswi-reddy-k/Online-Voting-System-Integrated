package com.project.online_voting_system.model;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(name = "full_name")
    private String fullName;

    @Column(unique = true)
    private String epicNumber; // Voter ID card number (EPIC)

    private String constituency; // Parliamentary/Assembly constituency

    private String dob; // Date of birth (YYYY-MM-DD)

    @Enumerated(EnumType.STRING)
    @Column(name = "role")
    private Role role;

    @Column(name = "is_verified")
    private Boolean isVerified = true;

    private LocalDateTime createdAt;

    public User() {
    }

    public User(Long id, String email, String password, String fullName, String epicNumber, String constituency, Role role, boolean isVerified, LocalDateTime createdAt) {
        this.id = id;
        this.email = email;
        this.password = password;
        this.fullName = fullName;
        this.epicNumber = epicNumber;
        this.constituency = constituency;
        this.role = role;
        this.isVerified = isVerified;
        this.createdAt = createdAt;
    }

    public User(String email, String password, String fullName, String epicNumber, String constituency, Role role, boolean isVerified) {
        this.email = email;
        this.password = password;
        this.fullName = fullName;
        this.epicNumber = epicNumber;
        this.constituency = constituency;
        this.role = role;
        this.isVerified = isVerified;
        this.createdAt = LocalDateTime.now();
    }

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getEpicNumber() {
        return epicNumber;
    }

    public void setEpicNumber(String epicNumber) {
        this.epicNumber = epicNumber;
    }

    public String getConstituency() {
        return constituency;
    }

    public void setConstituency(String constituency) {
        this.constituency = constituency;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public boolean isVerified() {
        return Boolean.TRUE.equals(isVerified);
    }

    public void setVerified(Boolean verified) {
        this.isVerified = verified != null ? verified : true;
    }

    public String getDob() {
        return dob;
    }

    public void setDob(String dob) {
        this.dob = dob;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

}
