package com.project.online_voting_system.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class CandidateRegistrationRequest {

    @NotNull(message = "Election ID is required")
    private Long electionId;

    @NotBlank(message = "Candidate name is required")
    private String name;

    @NotBlank(message = "Party name is required")
    private String party;

    private String manifesto;

    private String photoUrl;

    private String paymentTransactionId;

    private Double securityDepositAmount = 25.00;

    private String dob;

    private Integer age;

    public CandidateRegistrationRequest() {
    }

    public CandidateRegistrationRequest(Long electionId, String name, String party, String manifesto, String photoUrl) {
        this.electionId = electionId;
        this.name = name;
        this.party = party;
        this.manifesto = manifesto;
        this.photoUrl = photoUrl;
    }

    public CandidateRegistrationRequest(Long electionId, String name, String party, String manifesto, String photoUrl, String paymentTransactionId, Double securityDepositAmount) {
        this.electionId = electionId;
        this.name = name;
        this.party = party;
        this.manifesto = manifesto;
        this.photoUrl = photoUrl;
        this.paymentTransactionId = paymentTransactionId;
        this.securityDepositAmount = securityDepositAmount != null ? securityDepositAmount : 25.00;
    }

    public Long getElectionId() {
        return electionId;
    }

    public void setElectionId(Long electionId) {
        this.electionId = electionId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getParty() {
        return party;
    }

    public void setParty(String party) {
        this.party = party;
    }

    public String getManifesto() {
        return manifesto;
    }

    public void setManifesto(String manifesto) {
        this.manifesto = manifesto;
    }

    public String getPhotoUrl() {
        return photoUrl;
    }

    public void setPhotoUrl(String photoUrl) {
        this.photoUrl = photoUrl;
    }

    public String getPaymentTransactionId() {
        return paymentTransactionId;
    }

    public void setPaymentTransactionId(String paymentTransactionId) {
        this.paymentTransactionId = paymentTransactionId;
    }

    public Double getSecurityDepositAmount() {
        return securityDepositAmount;
    }

    public void setSecurityDepositAmount(Double securityDepositAmount) {
        this.securityDepositAmount = securityDepositAmount;
    }

    public String getDob() {
        return dob;
    }

    public void setDob(String dob) {
        this.dob = dob;
    }

    public Integer getAge() {
        return age;
    }

    public void setAge(Integer age) {
        this.age = age;
    }
}
