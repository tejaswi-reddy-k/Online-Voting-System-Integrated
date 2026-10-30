package com.project.online_voting_system.dto;

import java.time.LocalDateTime;

public class PaymentOrderResponse {

    private String orderId;
    private Double amount;
    private String currency;
    private Long electionId;
    private String electionTitle;
    private String candidateName;
    private LocalDateTime createdAt;
    private String status;

    public PaymentOrderResponse() {
    }

    public PaymentOrderResponse(String orderId, Double amount, String currency, Long electionId, String electionTitle, String candidateName, LocalDateTime createdAt, String status) {
        this.orderId = orderId;
        this.amount = amount;
        this.currency = currency;
        this.electionId = electionId;
        this.electionTitle = electionTitle;
        this.candidateName = candidateName;
        this.createdAt = createdAt;
        this.status = status;
    }

    public String getOrderId() {
        return orderId;
    }

    public void setOrderId(String orderId) {
        this.orderId = orderId;
    }

    public Double getAmount() {
        return amount;
    }

    public void setAmount(Double amount) {
        this.amount = amount;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public Long getElectionId() {
        return electionId;
    }

    public void setElectionId(Long electionId) {
        this.electionId = electionId;
    }

    public String getElectionTitle() {
        return electionTitle;
    }

    public void setElectionTitle(String electionTitle) {
        this.electionTitle = electionTitle;
    }

    public String getCandidateName() {
        return candidateName;
    }

    public void setCandidateName(String candidateName) {
        this.candidateName = candidateName;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
