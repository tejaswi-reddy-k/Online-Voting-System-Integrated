package com.project.online_voting_system.controller;

import com.project.online_voting_system.dto.VoteReceiptResponse;
import com.project.online_voting_system.dto.VoteRequest;
import com.project.online_voting_system.service.ElectionService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/voters")
public class VoterController {

    private final ElectionService electionService;

    public VoterController(ElectionService electionService) {
        this.electionService = electionService;
    }

    /**
     * Cast ballot securely in an active election
     */
    @PostMapping("/vote")
    public ResponseEntity<VoteReceiptResponse> castVote(
            @Valid @RequestBody VoteRequest request,
            Authentication authentication
    ) {
        String email = (authentication != null && authentication.getName() != null)
                ? authentication.getName()
                : "voter@citizen.in";
        return ResponseEntity.ok(electionService.castVote(request, email));
    }

    /**
     * Public cryptographic ballot verification endpoint
     */
    @GetMapping("/verify-ballot/{ballotHash}")
    public ResponseEntity<VoteReceiptResponse> verifyBallot(@PathVariable String ballotHash) {
        return ResponseEntity.ok(electionService.verifyBallot(ballotHash));
    }
}
