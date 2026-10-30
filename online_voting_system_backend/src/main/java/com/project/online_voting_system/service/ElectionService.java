package com.project.online_voting_system.service;

import com.project.online_voting_system.dto.CandidateRegistrationRequest;
import com.project.online_voting_system.dto.ElectionRequest;
import com.project.online_voting_system.dto.ElectionResultResponse;
import com.project.online_voting_system.dto.VoteReceiptResponse;
import com.project.online_voting_system.dto.VoteRequest;
import com.project.online_voting_system.model.Candidate;
import com.project.online_voting_system.model.Election;
import com.project.online_voting_system.model.User;
import com.project.online_voting_system.model.Vote;
import com.project.online_voting_system.repository.CandidateRepository;
import com.project.online_voting_system.repository.ElectionRepository;
import com.project.online_voting_system.repository.UserRepository;
import com.project.online_voting_system.repository.VoteRepository;
import org.springframework.cache.annotation.Cacheable;
import jakarta.transaction.Transactional;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ElectionService {

    private final ElectionRepository electionRepository;
    private final CandidateRepository candidateRepository;
    private final VoteRepository voteRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final ElectionStreamService electionStreamService;

    public ElectionService(ElectionRepository electionRepository,
                           CandidateRepository candidateRepository,
                           VoteRepository voteRepository,
                           UserRepository userRepository,
                           EmailService emailService,
                           ElectionStreamService electionStreamService) {
        this.electionRepository = electionRepository;
        this.candidateRepository = candidateRepository;
        this.voteRepository = voteRepository;
        this.userRepository = userRepository;
        this.emailService = emailService;
        this.electionStreamService = electionStreamService;
    }

    @Cacheable(value = "elections", key = "'all_published'")
    public List<Election> getPublishedElections() {
        return electionRepository.findByIsPublishedTrue();
    }

    public List<Election> getAllElections() {
        return electionRepository.findAll();
    }

    public Election getElectionById(Long id) {
        return electionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Election not found with ID: " + id));
    }

    @CacheEvict(value = "elections", allEntries = true)
    @Transactional
    public Election createElection(ElectionRequest request, String adminEmail) {
        Election election = new Election(
                request.getTitle(),
                request.getDescription(),
                request.getStartTime(),
                request.getEndTime(),
                true,
                false
        );

        Election saved = electionRepository.save(election);

        if (request.getCandidates() != null && !request.getCandidates().isEmpty()) {
            List<Candidate> candidates = request.getCandidates().stream().map(c -> new Candidate(
                    c.getName(),
                    c.getParty(),
                    c.getManifesto(),
                    c.getPhotoUrl(),
                    saved
            )).collect(Collectors.toList());
            candidateRepository.saveAll(candidates);
            saved.setCandidates(candidates);
        }

        return saved;
    }

    @CacheEvict(value = "elections", allEntries = true)
    @Transactional
    public Election updateElection(Long id, ElectionRequest request, String adminEmail) {
        Election election = getElectionById(id);
        election.setTitle(request.getTitle());
        if (request.getDescription() != null) {
            election.setDescription(request.getDescription());
        }
        if (request.getStartTime() != null) {
            election.setStartTime(request.getStartTime());
        }
        if (request.getEndTime() != null) {
            election.setEndTime(request.getEndTime());
        }
        return electionRepository.save(election);
    }

    @CacheEvict(value = "elections", allEntries = true)
    @Transactional
    public void deleteElection(Long id, String adminEmail) {
        voteRepository.deleteByElectionId(id);
        candidateRepository.deleteByElectionId(id);
        electionRepository.deleteById(id);
    }

    @CacheEvict(value = "elections", allEntries = true)
    @Transactional
    public Candidate registerCandidate(CandidateRegistrationRequest request, String userEmail) {
        Election election = getElectionById(request.getElectionId());
        Candidate candidate = new Candidate(
                request.getName(),
                request.getParty(),
                request.getManifesto() != null ? request.getManifesto() : "Manifesto for " + election.getTitle(),
                request.getPhotoUrl() != null && !request.getPhotoUrl().isBlank()
                        ? request.getPhotoUrl()
                        : "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400",
                election
        );
        return candidateRepository.save(candidate);
    }

    @CacheEvict(value = "elections", allEntries = true)
    @Transactional
    public void deleteCandidate(Long candidateId, String adminEmail) {
        voteRepository.deleteByCandidateId(candidateId);
        candidateRepository.deleteById(candidateId);
    }

    public Candidate getCandidateById(Long candidateId) {
        return candidateRepository.findById(candidateId)
                .orElseThrow(() -> new RuntimeException("Candidate not found with ID: " + candidateId));
    }

    public List<Candidate> getCandidatesByElectionId(Long electionId) {
        return candidateRepository.findByElectionId(electionId);
    }

    public List<Candidate> getAllCandidates() {
        return candidateRepository.findAll();
    }

    @CacheEvict(value = "elections", allEntries = true)
    @Transactional
    public VoteReceiptResponse castVote(VoteRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!user.isVerified()) {
            throw new RuntimeException("Voter identity is not yet verified.");
        }

        Election election = electionRepository.findById(request.getElectionId())
                .orElseThrow(() -> new RuntimeException("Election not found"));

        LocalDateTime now = LocalDateTime.now();
        if (now.isBefore(election.getStartTime()) || now.isAfter(election.getEndTime())) {
            throw new RuntimeException("Voting is not active for this election period.");
        }

        if (voteRepository.existsByUserIdAndElectionId(user.getId(), election.getId())) {
            throw new RuntimeException("You have already cast your ballot for this election.");
        }

        Candidate candidate = candidateRepository.findById(request.getCandidateId())
                .orElseThrow(() -> new RuntimeException("Candidate not found"));

        if (candidate.getElection() == null || !candidate.getElection().getId().equals(election.getId())) {
            throw new RuntimeException("Selected candidate does not belong to this election.");
        }

        // Atomically increment candidate vote tally
        candidate.setVoteCount(candidate.getVoteCount() + 1);
        candidateRepository.save(candidate);

        // Generate cryptographic SHA-256 ballot hash
        String rawData = user.getId() + ":" + election.getId() + ":" + candidate.getId() + ":" + UUID.randomUUID() + ":" + System.currentTimeMillis();
        String ballotHash = generateSha256(rawData);

        Vote vote = new Vote(user, election, candidate, ballotHash);
        voteRepository.save(vote);

        // Broadcast updated results live via SSE stream
        try {
            ElectionResultResponse updatedResults = getElectionResults(election.getId());
            electionStreamService.broadcastResults(election.getId(), updatedResults);
        } catch (Exception ignored) {
        }

        // Dispatch Email notification receipt
        emailService.sendVoteReceipt(user.getEmail(), election.getTitle(), candidate.getName(), ballotHash);

        VoteReceiptResponse receipt = new VoteReceiptResponse();
        receipt.setBallotHash(ballotHash);
        receipt.setElectionId(election.getId());
        receipt.setElectionTitle(election.getTitle());
        receipt.setCandidateName(candidate.getName());
        receipt.setTimestamp(LocalDateTime.now());
        receipt.setVerificationStatus("VERIFIED_AND_RECORDED");

        return receipt;
    }

    public boolean hasUserVoted(Long electionId, String userEmail) {
        User user = userRepository.findByEmail(userEmail).orElse(null);
        if (user == null) return false;
        return voteRepository.existsByUserIdAndElectionId(user.getId(), electionId);
    }

    @Transactional
    public VoteReceiptResponse verifyBallot(String ballotHash) {
        Vote vote = voteRepository.findByBallotHash(ballotHash)
                .orElseThrow(() -> new RuntimeException("No ballot found matching cryptographic hash: " + ballotHash));

        VoteReceiptResponse receipt = new VoteReceiptResponse();
        receipt.setBallotHash(vote.getBallotHash());
        receipt.setElectionId(vote.getElection().getId());
        receipt.setElectionTitle(vote.getElection().getTitle());
        receipt.setCandidateName(vote.getCandidate().getName());
        receipt.setTimestamp(vote.getCastAt());
        receipt.setVerificationStatus("AUTHENTIC_AND_RECORDED");
        return receipt;
    }

    @CacheEvict(value = "elections", allEntries = true)
    @Transactional
    public void toggleResultsAnnouncement(Long electionId, boolean announce, String adminEmail) {
        Election election = getElectionById(electionId);
        election.setResultsAnnounced(announce);
        electionRepository.save(election);

        try {
            ElectionResultResponse updatedResults = getElectionResults(electionId);
            electionStreamService.broadcastResults(electionId, updatedResults);
        } catch (Exception ignored) {
        }
    }

    public SseEmitter subscribeToResults(Long electionId) {
        Election election = electionRepository.findById(electionId).orElse(null);
        if (election == null) {
            List<Election> all = electionRepository.findAll();
            if (!all.isEmpty()) {
                election = all.get(0);
                electionId = election.getId();
            }
        }
        ElectionResultResponse currentResults = (election != null)
                ? getElectionResults(election.getId())
                : createEmptyResults(electionId);
        return electionStreamService.subscribe(electionId, currentResults);
    }

    public SseEmitter subscribeToAllResults() {
        List<ElectionResultResponse> allResults = electionRepository.findByIsPublishedTrue().stream()
                .map(e -> getElectionResults(e.getId()))
                .collect(Collectors.toList());
        return electionStreamService.subscribeGlobal(allResults);
    }

    public ElectionResultResponse getElectionResults(Long electionId) {
        Election election = electionRepository.findById(electionId).orElse(null);
        if (election == null) {
            return createEmptyResults(electionId);
        }

        List<Candidate> candidates = candidateRepository.findByElectionId(electionId);
        long totalVotes = candidates.stream().mapToLong(Candidate::getVoteCount).sum();

        List<ElectionResultResponse.CandidateResult> candidateResults = candidates.stream().map(c -> {
            ElectionResultResponse.CandidateResult cr = new ElectionResultResponse.CandidateResult();
            cr.setId(c.getId());
            cr.setName(c.getName());
            cr.setParty(c.getParty());
            cr.setVoteCount(c.getVoteCount());
            cr.setPercentage(totalVotes > 0 ? ((double) c.getVoteCount() / totalVotes) * 100.0 : 0.0);
            return cr;
        }).collect(Collectors.toList());

        ElectionResultResponse response = new ElectionResultResponse();
        response.setElectionId(election.getId());
        response.setTitle(election.getTitle());
        response.setTotalVotes(totalVotes);
        response.setResultsAnnounced(election.isResultsAnnounced());
        response.setResults(candidateResults);

        return response;
    }

    private ElectionResultResponse createEmptyResults(Long electionId) {
        ElectionResultResponse response = new ElectionResultResponse();
        response.setElectionId(electionId != null ? electionId : 0L);
        response.setTitle("Election Results Pending");
        response.setTotalVotes(0);
        response.setResultsAnnounced(false);
        response.setResults(List.of());
        return response;
    }

    public void emailElectionResults(Long electionId, String recipientEmail) {
        ElectionResultResponse results = getElectionResults(electionId);
        List<Candidate> candidates = candidateRepository.findByElectionId(electionId);
        Candidate winner = null;
        long maxVotes = -1;
        for (Candidate c : candidates) {
            if (c.getVoteCount() > maxVotes) {
                maxVotes = c.getVoteCount();
                winner = c;
            }
        }
        String winnerName = (winner != null) ? winner.getName() : "Undetermined";
        String winnerParty = (winner != null) ? winner.getParty() : "N/A";
        long winnerVotes = (winner != null) ? winner.getVoteCount() : 0;
        emailService.sendResultsNotification(
                recipientEmail,
                results.getTitle(),
                winnerName,
                winnerParty,
                winnerVotes,
                results.getTotalVotes()
        );
    }

    private String generateSha256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] encodedhash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder(2 * encodedhash.length);
            for (byte b : encodedhash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }
            return "0x" + hexString.toString().substring(0, 32).toUpperCase();
        } catch (NoSuchAlgorithmException e) {
            return "0x" + UUID.randomUUID().toString().replace("-", "").toUpperCase();
        }
    }
}

