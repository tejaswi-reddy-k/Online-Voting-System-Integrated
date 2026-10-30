package com.project.online_voting_system.model;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "votes", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"user_id", "election_id"})
})
public class Vote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "election_id", nullable = false)
    private Election election;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "candidate_id", nullable = false)
    private Candidate candidate;

    @Column(nullable = false, unique = true)
    private String ballotHash;

    private LocalDateTime castAt;

    public Vote() {
    }

    public Vote(Long id, User user, Election election, Candidate candidate, String ballotHash, LocalDateTime castAt) {
        this.id = id;
        this.user = user;
        this.election = election;
        this.candidate = candidate;
        this.ballotHash = ballotHash;
        this.castAt = castAt;
    }

    public Vote(User user, Election election, Candidate candidate, String ballotHash) {
        this.user = user;
        this.election = election;
        this.candidate = candidate;
        this.ballotHash = ballotHash;
        this.castAt = LocalDateTime.now();
    }

    @PrePersist
    protected void onCreate() {
        if (this.castAt == null) {
            this.castAt = LocalDateTime.now();
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public Election getElection() {
        return election;
    }

    public void setElection(Election election) {
        this.election = election;
    }

    public Candidate getCandidate() {
        return candidate;
    }

    public void setCandidate(Candidate candidate) {
        this.candidate = candidate;
    }

    public String getBallotHash() {
        return ballotHash;
    }

    public void setBallotHash(String ballotHash) {
        this.ballotHash = ballotHash;
    }

    public LocalDateTime getCastAt() {
        return castAt;
    }

    public void setCastAt(LocalDateTime castAt) {
        this.castAt = castAt;
    }
}

