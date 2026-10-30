package com.project.online_voting_system.dto;

import java.util.List;

public class ElectionResultResponse {

    private Long electionId;
    private String title;
    private long totalVotes;
    private boolean resultsAnnounced;
    private List<CandidateResult> results;

    public ElectionResultResponse() {
    }

    public ElectionResultResponse(Long electionId, String title, long totalVotes, boolean resultsAnnounced, List<CandidateResult> results) {
        this.electionId = electionId;
        this.title = title;
        this.totalVotes = totalVotes;
        this.resultsAnnounced = resultsAnnounced;
        this.results = results;
    }

    public Long getElectionId() {
        return electionId;
    }

    public void setElectionId(Long electionId) {
        this.electionId = electionId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public long getTotalVotes() {
        return totalVotes;
    }

    public void setTotalVotes(long totalVotes) {
        this.totalVotes = totalVotes;
    }

    public boolean isResultsAnnounced() {
        return resultsAnnounced;
    }

    public void setResultsAnnounced(boolean resultsAnnounced) {
        this.resultsAnnounced = resultsAnnounced;
    }

    public List<CandidateResult> getResults() {
        return results;
    }

    public void setResults(List<CandidateResult> results) {
        this.results = results;
    }

    public static class CandidateResult {
        private Long id;
        private String name;
        private String party;
        private long voteCount;
        private double percentage;

        public CandidateResult() {
        }

        public CandidateResult(Long id, String name, String party, long voteCount, double percentage) {
            this.id = id;
            this.name = name;
            this.party = party;
            this.voteCount = voteCount;
            this.percentage = percentage;
        }

        public Long getId() {
            return id;
        }

        public void setId(Long id) {
            this.id = id;
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

        public long getVoteCount() {
            return voteCount;
        }

        public void setVoteCount(long voteCount) {
            this.voteCount = voteCount;
        }

        public double getPercentage() {
            return percentage;
        }

        public void setPercentage(double percentage) {
            this.percentage = percentage;
        }
    }
}
