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
        return ResponseEntity.ok(electionService.registerCandidate(request, authentication.getName()));
    }

    /**
     * Admin operation to withdraw / delete a candidate
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<Map<String, String>> deleteCandidate(
            @PathVariable Long id,
            Authentication authentication
    ) {
        electionService.deleteCandidate(id, authentication.getName());
        return ResponseEntity.ok(Map.of("message", "Candidate removed successfully with ID: " + id));
    }
}
