package com.project.online_voting_system.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

@Entity
@Table(name = "candidates")
public class Candidate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String party;

    @Column(columnDefinition = "TEXT")
    private String manifesto;

    private String photoUrl;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "election_id", nullable = false)
    @JsonIgnore
    private Election election;

    @Column(nullable = false)
    private long voteCount;

    private String paymentTransactionId;

    @Column(name = "security_deposit_paid", nullable = true)
    private Boolean securityDepositPaid = true;

    private Double securityDepositAmount = 25.00;

    public Candidate() {
    }

    public Candidate(Long id, String name, String party, String manifesto, String photoUrl, Election election, long voteCount) {
        this.id = id;
        this.name = name;
        this.party = party;
        this.manifesto = manifesto;
        this.photoUrl = photoUrl;
        this.election = election;
        this.voteCount = voteCount;
    }

    public Candidate(String name, String party, String manifesto, String photoUrl, Election election) {
        this.name = name;
        this.party = party;
        this.manifesto = manifesto;
        this.photoUrl = photoUrl;
        this.election = election;
        this.voteCount = 0;
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

    public Election getElection() {
        return election;
    }

    public void setElection(Election election) {
        this.election = election;
    }

    public long getVoteCount() {
        return voteCount;
    }

    public void setVoteCount(long voteCount) {
        this.voteCount = voteCount;
    }

    public String getPaymentTransactionId() {
        return paymentTransactionId;
    }

    public void setPaymentTransactionId(String paymentTransactionId) {
        this.paymentTransactionId = paymentTransactionId;
    }

    public Boolean isSecurityDepositPaid() {
        return securityDepositPaid;
    }

    public void setSecurityDepositPaid(Boolean securityDepositPaid) {
        this.securityDepositPaid = securityDepositPaid;
    }

    public Double getSecurityDepositAmount() {
        return securityDepositAmount;
    }

    public void setSecurityDepositAmount(Double securityDepositAmount) {
        this.securityDepositAmount = securityDepositAmount;
    }
}
