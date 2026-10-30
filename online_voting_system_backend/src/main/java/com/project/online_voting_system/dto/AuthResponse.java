package com.project.online_voting_system.dto;

public class AuthResponse {

    private String token;
    private String type = "Bearer";
    private Long id;
    private String email;
    private String fullName;
    private String dob;
    private String epicNumber;
    private String constituency;
    private String role;
    private boolean isVerified;

    public AuthResponse() {
    }

    public AuthResponse(String token, Long id, String email, String fullName, String epicNumber, String constituency, String role, boolean isVerified) {
        this.token = token;
        this.id = id;
        this.email = email;
        this.fullName = fullName;
        this.epicNumber = epicNumber;
        this.constituency = constituency;
        this.role = role;
        this.isVerified = isVerified;
    }

    public AuthResponse(String token, Long id, String email, String fullName, String dob, String epicNumber, String constituency, String role, boolean isVerified) {
        this.token = token;
        this.id = id;
        this.email = email;
        this.fullName = fullName;
        this.dob = dob;
        this.epicNumber = epicNumber;
        this.constituency = constituency;
        this.role = role;
        this.isVerified = isVerified;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
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

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getDob() {
        return dob;
    }

    public void setDob(String dob) {
        this.dob = dob;
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

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public boolean isVerified() {
        return isVerified;
    }

    public void setVerified(boolean verified) {
        isVerified = verified;
    }
}
