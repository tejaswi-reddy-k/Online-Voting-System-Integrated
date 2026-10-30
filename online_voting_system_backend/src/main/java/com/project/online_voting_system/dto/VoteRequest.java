package com.project.online_voting_system.dto;

import jakarta.validation.constraints.NotNull;

public class VoteRequest {

    @NotNull
    private Long electionId;

    @NotNull
    private Long candidateId;

    public VoteRequest() {
    }

    public VoteRequest(Long electionId, Long candidateId) {
        this.electionId = electionId;
        this.candidateId = candidateId;
    }

    public Long getElectionId() {
        return electionId;
    }

    public void setElectionId(Long electionId) {
        this.electionId = electionId;
    }

    public Long getCandidateId() {
        return candidateId;
    }

    public void setCandidateId(Long candidateId) {
        this.candidateId = candidateId;
    }

}
