package com.project.online_voting_system.dto;

import java.time.LocalDateTime;

public class VoteReceiptResponse {

    private String ballotHash;
    private Long electionId;
    private String electionTitle;
    private String candidateName;
    private LocalDateTime timestamp;
    private String verificationStatus;

    public VoteReceiptResponse() {
    }

    public VoteReceiptResponse(String ballotHash, Long electionId, String electionTitle, String candidateName, LocalDateTime timestamp, String verificationStatus) {
        this.ballotHash = ballotHash;
        this.electionId = electionId;
        this.electionTitle = electionTitle;
        this.candidateName = candidateName;
        this.timestamp = timestamp;
        this.verificationStatus = verificationStatus;
    }

    public String getBallotHash() {
        return ballotHash;
    }

    public void setBallotHash(String ballotHash) {
        this.ballotHash = ballotHash;
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

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    public String getVerificationStatus() {
        return verificationStatus;
    }

    public void setVerificationStatus(String verificationStatus) {
        this.verificationStatus = verificationStatus;
    }
}

