package com.project.online_voting_system.controller;

import com.project.online_voting_system.dto.CandidateRegistrationRequest;
import com.project.online_voting_system.model.Candidate;
import com.project.online_voting_system.service.ElectionService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/candidates")
public class CandidateController {

    private final ElectionService electionService;

    public CandidateController(ElectionService electionService) {
        this.electionService = electionService;
    }

    /**
     * Nominate / Register candidate for an election
     */
    @PostMapping("/register")
    public ResponseEntity<Candidate> registerCandidate(
            @Valid @RequestBody CandidateRegistrationRequest request,
            Authentication authentication
    ) {
        String email = (authentication != null && authentication.getName() != null)
                ? authentication.getName()
                : "voter@gmail.com";
        return ResponseEntity.ok(electionService.registerCandidate(request, email));
    }

    /**
     * View candidate by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<Candidate> getCandidateById(@PathVariable Long id) {
        return ResponseEntity.ok(electionService.getCandidateById(id));
    }

    /**
     * View all candidates nominated for a specific election
     */
    @GetMapping("/election/{electionId}")
    public ResponseEntity<java.util.List<Candidate>> getCandidatesByElectionId(@PathVariable Long electionId) {
        return ResponseEntity.ok(electionService.getCandidatesByElectionId(electionId));
    }

    /**
     * View all candidates
     */
    @GetMapping
    public ResponseEntity<java.util.List<Candidate>> getAllCandidates() {
        return ResponseEntity.ok(electionService.getAllCandidates());
    }

    /**
     * Candidate or Admin operation to withdraw / exit from the election
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteCandidate(
            @PathVariable Long id,
            Authentication authentication
    ) {
        String actor = (authentication != null && authentication.getName() != null)
                ? authentication.getName()
                : "Candidate / Elector";
        electionService.deleteCandidate(id, actor);
        return ResponseEntity.ok(Map.of("message", "Candidate nomination successfully withdrawn / exited from election with ID: " + id));
    }

    /**
     * Candidate or Admin operation to edit candidate details
     */
    @PutMapping("/{id}")
    public ResponseEntity<Candidate> updateCandidate(
            @PathVariable Long id,
            @RequestBody CandidateRegistrationRequest request,
            Authentication authentication
    ) {
        String actor = (authentication != null && authentication.getName() != null)
                ? authentication.getName()
                : "Candidate / Elector";
        return ResponseEntity.ok(electionService.updateCandidate(id, request, actor));
    }
}
