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

    public CandidateRegistrationRequest() {
    }

    public CandidateRegistrationRequest(Long electionId, String name, String party, String manifesto, String photoUrl) {
        this.electionId = electionId;
        this.name = name;
        this.party = party;
        this.manifesto = manifesto;
        this.photoUrl = photoUrl;
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
}
