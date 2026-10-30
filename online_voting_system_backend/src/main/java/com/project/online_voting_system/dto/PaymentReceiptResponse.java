package com.project.online_voting_system.dto;

import java.time.LocalDateTime;

public class PaymentReceiptResponse {

    private String transactionId;
    private String orderId;
    private Double amount;
    private String currency;
    private String status;
    private String paymentMethod;
    private String treasuryReference;
    private LocalDateTime timestamp;
    private String candidateEmail;
    private String description;

    public PaymentReceiptResponse() {
    }

    public PaymentReceiptResponse(String transactionId, String orderId, Double amount, String currency, String status, String paymentMethod, String treasuryReference, LocalDateTime timestamp, String candidateEmail, String description) {
        this.transactionId = transactionId;
        this.orderId = orderId;
        this.amount = amount;
        this.currency = currency;
        this.status = status;
        this.paymentMethod = paymentMethod;
        this.treasuryReference = treasuryReference;
        this.timestamp = timestamp;
        this.candidateEmail = candidateEmail;
        this.description = description;
    }

    public String getTransactionId() {
        return transactionId;
    }

    public void setTransactionId(String transactionId) {
        this.transactionId = transactionId;
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

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public String getTreasuryReference() {
        return treasuryReference;
    }

    public void setTreasuryReference(String treasuryReference) {
        this.treasuryReference = treasuryReference;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    public String getCandidateEmail() {
        return candidateEmail;
    }

    public void setCandidateEmail(String candidateEmail) {
        this.candidateEmail = candidateEmail;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}
