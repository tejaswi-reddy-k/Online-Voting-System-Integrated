package com.project.online_voting_system.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;
import java.util.List;

public class ElectionRequest {

    @NotBlank
    private String title;

    private String description;

    @NotNull
    private LocalDateTime startTime;

    @NotNull
    private LocalDateTime endTime;

    private List<CandidateRequest> candidates;

    public ElectionRequest() {
    }

    public ElectionRequest(String title, String description, LocalDateTime startTime, LocalDateTime endTime, List<CandidateRequest> candidates) {
        this.title = title;
        this.description = description;
        this.startTime = startTime;
        this.endTime = endTime;
        this.candidates = candidates;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public LocalDateTime getStartTime() {
        return startTime;
    }

    public void setStartTime(LocalDateTime startTime) {
        this.startTime = startTime;
    }

    public LocalDateTime getEndTime() {
        return endTime;
    }

    public void setEndTime(LocalDateTime endTime) {
        this.endTime = endTime;
    }

    public List<CandidateRequest> getCandidates() {
        return candidates;
    }

    public void setCandidates(List<CandidateRequest> candidates) {
        this.candidates = candidates;
    }

    public static class CandidateRequest {
        @NotBlank
        private String name;
        private String party;
        private String manifesto;
        private String photoUrl;

        public CandidateRequest() {
        }

        public CandidateRequest(String name, String party, String manifesto, String photoUrl) {
            this.name = name;
            this.party = party;
            this.manifesto = manifesto;
            this.photoUrl = photoUrl;
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
}
