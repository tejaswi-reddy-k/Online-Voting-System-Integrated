package com.project.online_voting_system.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public class PaymentOrderRequest {

    @NotNull(message = "Election ID is required")
    private Long electionId;

    private String candidateName;

    @Positive(message = "Amount must be positive")
    private Double amount = 25.00;

    public PaymentOrderRequest() {
    }

    public PaymentOrderRequest(Long electionId, String candidateName, Double amount) {
        this.electionId = electionId;
        this.candidateName = candidateName;
        this.amount = amount != null ? amount : 25.00;
    }

    public Long getElectionId() {
        return electionId;
    }

    public void setElectionId(Long electionId) {
        this.electionId = electionId;
    }

    public String getCandidateName() {
        return candidateName;
    }

    public void setCandidateName(String candidateName) {
        this.candidateName = candidateName;
    }

    public Double getAmount() {
        return amount;
    }

    public void setAmount(Double amount) {
        this.amount = amount;
    }
}
