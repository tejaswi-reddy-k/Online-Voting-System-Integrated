package com.project.online_voting_system.dto;

public class SignupResponse {

    private String message;
    private Long id;
    private String fullName;
    private String email;
    private String dob;
    private String epicNumber;
    private String role;
    private boolean isVerified;

    public SignupResponse() {
    }

    public SignupResponse(String message, Long id, String fullName, String email, String dob, String epicNumber, String role, boolean isVerified) {
        this.message = message;
        this.id = id;
        this.fullName = fullName;
        this.email = email;
        this.dob = dob;
        this.epicNumber = epicNumber;
        this.role = role;
        this.isVerified = isVerified;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
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
